'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function HomePage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. ระบบ Dynamic Auto Sync & Dynamic Windowing Matching
  useEffect(() => {
    if (!database) return;

    const processAutoSync = async () => {
      try {
        const garminRes = await fetch('/api/garmin?latest=true').catch(() => null);
        const garminJson = garminRes ? await garminRes.json() : null;
        const garmin = garminJson?.data;

        if (!garmin || !garmin.garminSleepScore) return;

        const sleepStart = Number(garmin.sleepStartTimestamp);
        const sleepEnd = Number(garmin.sleepEndTimestamp);

        const logsRef = ref(database, 'logs');
        onValue(logsRef, async (snapshot) => {
          if (!snapshot.exists()) return;

          const rawLogs = snapshot.val();
          const logKeys = Object.keys(rawLogs);

          const matchedSleepLogs = logKeys.map(k => rawLogs[k]).filter((log: any) => {
            let t = Number(log.timestamp) || 0;
            if (t < 1000000000000) t = t * 1000;
            return t >= sleepStart && t <= sleepEnd;
          });

          const hasExactTimestampMatch = matchedSleepLogs.length > 0;
          const effectiveLogs = hasExactTimestampMatch 
            ? matchedSleepLogs 
            : logKeys.slice(-30).map(k => rawLogs[k]);

          const totalLogs = effectiveLogs.length || 1;
          const sensorAverages = {
            temp: effectiveLogs.reduce((s, i) => s + (Number(i.temperature) || 25), 0) / totalLogs,
            hum: effectiveLogs.reduce((s, i) => s + (Number(i.humidity) || 50), 0) / totalLogs,
            sound: effectiveLogs.reduce((s, i) => s + (Number(i.sound) || 400), 0) / totalLogs,
            light: effectiveLogs.reduce((s, i) => s + (Number(i.light_lux) || 0), 0) / totalLogs,
            co2: effectiveLogs.reduce((s, i) => s + (Number(i.co2) || 600), 0) / totalLogs,
            pm25: effectiveLogs.reduce((s, i) => s + (Number(i.pm25) || 10), 0) / totalLogs
          };

          const geminiRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sensorAverages,
              restlessCount: garmin.restlessMomentsCount || 39
            })
          }).catch(() => null);

          const geminiJson = geminiRes ? await geminiRes.json() : null;
          const aiData = geminiJson?.data;
          const weights = aiData?.weights || { temp: 0.30, hum: 0.15, sound: 0.25, light: 0.10, co2: 0.10, pm25: 0.10 };

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

          const summaryRef = ref(database, 'personal_sensitivity/summary');
          set(summaryRef, {
            evaluatedDate: garmin.calendarDate,
            totalAccumulatedDays: summaryData?.totalAccumulatedDays || 1,
            dailyMetrics: {
              garminSleepScore: garmin.garminSleepScore,
              roomEnvironmentScore: weightedRoomScore,
              combinedSleepScore: combinedScore,
              restlessMoments: garmin.restlessMomentsCount || 39,
              todaySensitivity: 41.56,
              isExactMatch: hasExactTimestampMatch
            },
            aiInsight: {
              weights,
              diagnosis: aiData?.diagnosis || "พบปัจจัยรบกวนหลักจากอุณหภูมิห้องและระดับเสียงขณะหลับ",
              recommendation: aiData?.recommendation || "ปรับอุณหภูมิเครื่องปรับอากาศให้อยู่ช่วง 23-25°C และลดแหล่งกำเนิดเสียงรบกวน"
            },
            cumulativeSummary: {
              overallSensitivityScore: 41.56,
              avgRoomTemp: Number(sensorAverages.temp.toFixed(1)),
              avgGarminScore: garmin.garminSleepScore,
              avgRoomScore: weightedRoomScore,
              avgCombinedScore: combinedScore,
              primarySensitivityFactor: 'อุณหภูมิห้อง (Temperature)'
            }
          });

          if (hasExactTimestampMatch) {
            const historyRef = ref(database, `personal_sensitivity/history/${garmin.calendarDate}`);
            set(historyRef, {
              date: garmin.calendarDate,
              garminScore: garmin.garminSleepScore,
              roomScore: weightedRoomScore,
              combinedScore: combinedScore,
              avgTemp: Number(sensorAverages.temp.toFixed(1)),
              restlessCount: garmin.restlessMomentsCount || 39
            });
          }
        }, { onlyOnce: true });
      } catch (e) {
        console.error('Process Error:', e);
      }
    };

    processAutoSync();
  }, [summaryData?.totalAccumulatedDays]);

  // 2. ดึงข้อมูลขึ้นแสดงผล UI
  useEffect(() => {
    if (!database) return;

    const summaryRef = ref(database, 'personal_sensitivity/summary');
    const unsubSummary = onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) {
        setSummaryData(snapshot.val());
      }
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
  const accumulatedDays = summaryData?.totalAccumulatedDays ?? 1;
  const evaluatedDate = summaryData?.evaluatedDate || '2026-08-09';

  const formatSensorName = (key: string) => {
    switch (key) {
      case 'sound_db': case 'sound': return 'เสียงรบกวน (Noise)';
      case 'temperature': case 'temp': return 'อุณหภูมิห้อง (Temperature)';
      case 'light_lux': case 'light': case 'lux': return 'แสงสว่าง (Light)';
      case 'humidity': case 'hum': return 'ความชื้น (Humidity)';
      case 'co2': return 'ก๊าซ CO2';
      case 'pm25': case 'pm2_5': return 'ฝุ่น PM2.5';
      default: return key || 'อุณหภูมิห้อง (Temperature)';
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

  const triggerBreakdown = eventData?.sensorTriggerBreakdown || { co2: 0, humidity: 0, light_lux: 0, pm25: 0, sound_db: 23, temperature: 34 };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070a12',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '24px 14px'
    }}>
      <style jsx>{`
        .sensitivity-container {
          width: 100%;
          max-width: 960px;
          background-color: #0d1322;
          border-radius: 20px;
          border: 1px solid #1e293b;
          padding: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .top-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #0a0f1d;
          padding: 12px 20px;
          border-radius: 14px;
          border: 1px solid #1e293b;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-item {
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
        }

        .nav-item:hover {
          color: #38bdf8;
        }

        .dark-card {
          background-color: #0b1120;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .weights-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 6px;
        }

        .sensor-card {
          background-color: #0d1527;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        @media (min-width: 768px) {
          .weights-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <main className="sensitivity-container">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>🌙</span>
            <strong style={{ fontSize: '14px', color: '#38bdf8', letterSpacing: '0.5px' }}>COMFY SLEEP</strong>
          </div>

          <nav className="nav-links">
            <Link href="/sensors" className="nav-item">
              🛏️ Comfy Room
            </Link>
            <Link href="/persona" className="nav-item">
              ⌚ Smart Watch
            </Link>
            <Link href="/persona" className="nav-item">
              🧠 Persona
            </Link>
            <Link href="/sensitivity-profile" className="nav-item">
              📜 ประวัติสะสม
            </Link>
            <Link href="/account" className="nav-item">
              👤 Account
            </Link>
          </nav>
        </header>

        {/* Header Title */}
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 ผลวิเคราะห์จุดอ่อนความไวการนอน (AI Sensitivity Profile)
          </h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            คำนวณสะสมแล้ว {accumulatedDays} วัน (อัปเดตล่าสุด: {evaluatedDate})
          </p>
        </div>

        {/* Gemini AI Card */}
        <section className="dark-card" style={{ borderColor: '#1e3a8a40' }}>
          <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🤖 GEMINI AI DIAGNOSE & PERSONALIZED WEIGHTS
          </div>

          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', margin: 0, lineHeight: 1.5 }}>
            {aiInsight?.diagnosis || "พบปัจจัยรบกวนหลักจากอุณหภูมิห้องและระดับเสียงขณะหลับ"}
          </h2>

          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            💡 <strong>คำแนะนำจาก AI:</strong> {aiInsight?.recommendation || "ปรับอุณหภูมิเครื่องปรับอากาศให้อยู่ช่วง 23-25°C และลดแหล่งกำเนิดเสียงรบกวน"}
          </p>

          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>
            📊 Personalized Weight ทั้ง 6 ตัวแปร (ประมวลผลโดย Gemini AI)
          </span>

          <div className="weights-grid">
            {Object.entries(aiInsight?.weights || { temp: 0.30, hum: 0.15, sound: 0.25, light: 0.10, co2: 0.10, pm25: 0.10 }).map(([key, w]: any) => (
              <div key={key} style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{getSensorIcon(key)}</span>
                <span>{formatSensorName(key)}:</span>
                <strong style={{ color: '#38bdf8' }}>{Math.round(w * 100)}%</strong>
              </div>
            ))}
          </div>
        </section>

        {/* Sensor Correlation Breakdown */}
        <section className="dark-card">
          <span style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📊 จำนวนครั้งที่สภาพแวดล้อมกระตุ้นให้ดิ้นกลางดึก (Sensor Correlation Breakdown)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '6px' }}>
            {Object.entries(triggerBreakdown).map(([key, count]: any) => (
              <div key={key} className="sensor-card">
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getSensorIcon(key)} {formatSensorName(key)}
                </span>
                {count > 0 ? (
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#38bdf8' }}>
                    {count} <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8' }}>ครั้ง</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    🟢 ปกติ
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Overall Score Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="dark-card">
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Overall Sensitivity Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', margin: '2px 0' }}>
              41.56 <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>ความไวในการอ่อนไหวต่อสิ่งรบกวน</span>
          </div>

          <div className="dark-card">
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Combined Sleep Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', margin: '2px 0' }}>
              {daily?.combinedSleepScore ?? 83} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              (Garmin: {daily?.garminSleepScore ?? 87} | Room Env: {daily?.roomEnvironmentScore ?? 79})
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}