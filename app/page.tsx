'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function HomePage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) return;

    const processAutoSync = async () => {
      try {
        // 1. ดึง Garmin สด
        const garminRes = await fetch('/api/garmin?latest=true');
        if (!garminRes.ok) return;
        
        const garminJson = await garminRes.json();
        const garmin = garminJson?.data;
        if (!garmin) return;

        const sleepStart = Number(garmin.sleepStartTimestamp);
        const sleepEnd = Number(garmin.sleepEndTimestamp);

        // 2. อ่าน Log จริงจาก Firebase
        const logsRef = ref(database, 'logs');
        onValue(logsRef, async (snapshot) => {
          if (!snapshot.exists()) return;

          const rawLogs = snapshot.val();
          const logKeys = Object.keys(rawLogs);

          // กรองข้อมูลเซ็นเซอร์เฉพาะช่วงเวลานอนจริง
          const matchedSleepLogs = logKeys.map(k => rawLogs[k]).filter((log: any) => {
            let t = Number(log.timestamp) || 0;
            if (t < 1000000000000) t = t * 1000;
            return t >= sleepStart && t <= sleepEnd;
          });

          if (matchedSleepLogs.length === 0) return;

          const totalLogs = matchedSleepLogs.length;
          const sensorAverages = {
            temp: matchedSleepLogs.reduce((s, i) => s + (Number(i.temperature) || 0), 0) / totalLogs,
            hum: matchedSleepLogs.reduce((s, i) => s + (Number(i.humidity) || 0), 0) / totalLogs,
            sound: matchedSleepLogs.reduce((s, i) => s + (Number(i.sound) || 0), 0) / totalLogs,
            light: matchedSleepLogs.reduce((s, i) => s + (Number(i.light_lux) || 0), 0) / totalLogs,
            co2: matchedSleepLogs.reduce((s, i) => s + (Number(i.co2) || 0), 0) / totalLogs,
            pm25: matchedSleepLogs.reduce((s, i) => s + (Number(i.pm25) || 0), 0) / totalLogs
          };

          // 3. ส่งข้อมูลจริงให้ Gemini คำนวณ Weight
          const geminiRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sensorAverages,
              restlessCount: garmin.restlessMomentsCount
            })
          });

          if (!geminiRes.ok) return;
          const geminiJson = await geminiRes.json();
          const aiData = geminiJson?.data;
          if (!aiData?.weights) return;

          const weights = aiData.weights;

          // 4. คำนวณ Sub-score ตามค่าจริง
          const tempSubScore = Math.max(0, 100 - (sensorAverages.temp > 25 ? (sensorAverages.temp - 25) * 10 : (23 - sensorAverages.temp) * 10));
          const humSubScore = Math.max(0, 100 - (sensorAverages.hum > 60 ? (sensorAverages.hum - 60) * 4 : 0));
          const soundSubScore = sensorAverages.sound > 1000 ? 50 : 100;
          const lightSubScore = sensorAverages.light > 10 ? 70 : 100;
          const co2SubScore = sensorAverages.co2 > 1000 ? 60 : 100;
          const pm25SubScore = sensorAverages.pm25 > 37.5 ? 50 : 100;

          const weightedRoomScore = Math.round(
            (tempSubScore * weights.temp) +
            (humSubScore * weights.hum) +
            (soundSubScore * weights.sound) +
            (lightSubScore * weights.light) +
            (co2SubScore * weights.co2) +
            (pm25SubScore * weights.pm25)
          );

          const combinedScore = Math.round((garmin.garminSleepScore + weightedRoomScore) / 2);

          // 5. บันทึกผลลัพธ์จริงลง Firebase
          const summaryRef = ref(database, 'personal_sensitivity/summary');
          set(summaryRef, {
            evaluatedDate: garmin.calendarDate,
            totalAccumulatedDays: (summaryData?.totalAccumulatedDays || 0) + 1,
            dailyMetrics: {
              garminSleepScore: garmin.garminSleepScore,
              roomEnvironmentScore: weightedRoomScore,
              combinedSleepScore: combinedScore,
              restlessMoments: garmin.restlessMomentsCount
            },
            aiInsight: {
              weights,
              diagnosis: aiData.diagnosis,
              recommendation: aiData.recommendation
            },
            cumulativeSummary: {
              avgRoomTemp: Number(sensorAverages.temp.toFixed(1)),
              avgGarminScore: garmin.garminSleepScore,
              avgRoomScore: weightedRoomScore,
              avgCombinedScore: combinedScore
            }
          });

          // บันทึกเข้าตารางประวัติสะสม
          const historyRef = ref(database, `personal_sensitivity/history/${garmin.calendarDate}`);
          set(historyRef, {
            date: garmin.calendarDate,
            garminScore: garmin.garminSleepScore,
            roomScore: weightedRoomScore,
            combinedScore: combinedScore,
            avgTemp: Number(sensorAverages.temp.toFixed(1)),
            restlessCount: garmin.restlessMomentsCount
          });
        }, { onlyOnce: true });
      } catch (e) {
        console.error('Dynamic Process Error:', e);
      }
    };

    processAutoSync();
  }, [summaryData?.totalAccumulatedDays]);

  // ดึงข้อมูลขึ้น UI
  useEffect(() => {
    if (!database) return;

    const summaryRef = ref(database, 'personal_sensitivity/summary');
    const unsubSummary = onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) setSummaryData(snapshot.val());
    });

    const eventsRef = ref(database, 'personal_sensitivity/all_sensors_events');
    const unsubEvents = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dates = Object.keys(data).sort();
        if (dates.length > 0) setEventData(data[dates[dates.length - 1]]);
      }
      setLoading(false);
    });

    return () => {
      unsubSummary();
      unsubEvents();
    };
  }, []);

  const daily = summaryData?.dailyMetrics;
  const aiInsight = summaryData?.aiInsight;
  const accumulatedDays = summaryData?.totalAccumulatedDays || 0;
  const evaluatedDate = summaryData?.evaluatedDate || 'ไม่มีข้อมูล';

  const formatSensorName = (key: string) => {
    switch (key) {
      case 'sound_db': case 'sound': return 'เสียงรบกวน';
      case 'temperature': case 'temp': return 'อุณหภูมิห้อง';
      case 'light_lux': case 'light': case 'lux': return 'แสงสว่าง';
      case 'humidity': case 'hum': return 'ความชื้น';
      case 'co2': return 'ก๊าซ CO2';
      case 'pm25': case 'pm2_5': return 'ฝุ่น PM2.5';
      default: return key;
    }
  };

  const getSensorIcon = (key: string) => {
    switch (key) {
      case 'sound_db': case 'sound': return '🔊';
      case 'temperature': case 'temp': return '🌡️';
      case 'light_lux': case 'light': case 'lux': return '💡';
      case 'humidity': case 'hum': return '💧';
      case 'co2': return '🫁';
      case 'pm25': case 'pm2_5': return '🌫️';
      default: return '🌡️';
    }
  };

  const triggerBreakdown = eventData?.sensorTriggerBreakdown || {};

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.18) 0%, transparent 65%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px 12px 48px 12px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .app-container {
          width: 100%;
          max-width: 920px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .navbar-premium {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          padding: 8px 12px 8px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          position: sticky;
          top: 12px;
          z-index: 50;
        }

        .nav-scroll {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
        }

        .nav-scroll::-webkit-scrollbar { display: none; }

        .btn-nav-item {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          white-space: nowrap;
        }

        .btn-nav-item.active {
          color: #ffffff;
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          border-color: rgba(56, 189, 248, 0.6);
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 22px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .grid-weights {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .grid-breakdown {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        @media (min-width: 640px) {
          .grid-weights, .grid-breakdown { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      <main className="app-container">
        {/* Navbar */}
        <header className="navbar-premium">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>🌙</div>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc' }}>COMFY SLEEP</span>
          </div>

          <nav className="nav-scroll">
            <Link href="/sensors" className="btn-nav-item">🛏️ Comfy Room</Link>
            <Link href="/persona" className="btn-nav-item active">⌚ Smart Watch & Persona</Link>
            <Link href="/sensitivity-profile" className="btn-nav-item">📜 ประวัติสะสม</Link>
            <Link href="/account" className="btn-nav-item">👤 Account</Link>
          </nav>
        </header>

        {/* Title */}
        <div style={{ padding: '4px 6px 0 6px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🎯 AI Sensitivity Profile
          </h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            {loading ? 'กำลังดึงข้อมูลสดจาก Firebase...' : `สะสมข้อมูลแล้ว ${accumulatedDays} วัน (อัปเดตล่าสุด: ${evaluatedDate})`}
          </p>
        </div>

        {/* AI Diagnosis */}
        <section className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(14, 116, 144, 0.18) 100%)',
          borderColor: 'rgba(56, 189, 248, 0.35)'
        }}>
          <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase' }}>
            🤖 GEMINI AI DIAGNOSE & PERSONALIZED WEIGHTS
          </div>

          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            {aiInsight?.diagnosis || "รอการประมวลผลข้อมูลสดจาก Garmin และ เซ็นเซอร์..."}
          </h2>

          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            💡 <strong style={{ color: '#e2e8f0' }}>คำแนะนำจาก AI:</strong> {aiInsight?.recommendation || "โปรดตรวจสอบการเชื่อมต่อ Firebase/Garmin"}
          </p>

          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>
            📊 Personalized Weight ทั้ง 6 ตัวแปร (จาก Gemini AI)
          </span>

          <div className="grid-weights">
            {aiInsight?.weights ? (
              Object.entries(aiInsight.weights).map(([key, w]: any) => (
                <div key={key} style={{
                  fontSize: '11px',
                  color: '#cbd5e1',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>{getSensorIcon(key)} {formatSensorName(key)}</span>
                  <strong style={{ color: '#38bdf8' }}>{Math.round(w * 100)}%</strong>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '11px', color: '#64748b' }}>ไม่มีข้อมูล Weight สด</div>
            )}
          </div>
        </section>

        {/* Breakdown Card */}
        <section className="glass-card">
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            📊 จำนวนครั้งที่สภาพแวดล้อมกระตุ้นให้ดิ้นกลางดึก (Sensor Correlation Breakdown)
          </span>

          <div className="grid-breakdown">
            {Object.keys(triggerBreakdown).length > 0 ? (
              Object.entries(triggerBreakdown).map(([key, count]: any) => (
                <div key={key} style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getSensorIcon(key)} {formatSensorName(key)}
                  </span>
                  {count > 0 ? (
                    <strong style={{ fontSize: '18px', color: '#38bdf8', marginTop: '2px' }}>
                      {count} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>ครั้ง</span>
                    </strong>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', marginTop: '4px' }}>🟢 ปกติ</span>
                  )}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '11px', color: '#64748b' }}>ไม่มีข้อมูล Event ในฐานข้อมูล</div>
            )}
          </div>
        </section>

        {/* Scores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="glass-card">
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Garmin Sleep Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', margin: '2px 0' }}>
              {daily?.garminSleepScore ?? '--'} <span style={{ fontSize: '12px', color: '#64748b' }}>/ 100</span>
            </div>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Combined Sleep Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', margin: '2px 0' }}>
              {daily?.combinedSleepScore ?? '--'} <span style={{ fontSize: '12px', color: '#64748b' }}>/ 100</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}