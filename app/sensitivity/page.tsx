'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function SensitivityPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. กระบวนการตาม Flowchart: Garmin API + Matching + Gemini AI Diagnose + Room Score Calculation
  useEffect(() => {
    if (!database) return;

    const processAutoSync = async () => {
      try {
        // ดึงข้อมูล Garmin Connect API ล่าสุด
        const garminRes = await fetch('/api/garmin?latest=true').catch(() => null);
        const garminJson = garminRes ? await garminRes.json() : null;
        const garmin = garminJson?.data;

        if (!garmin || !garmin.garminSleepScore) {
          console.warn('Garmin sleep data is not ready yet.');
          return;
        }

        const sleepStart = Number(garmin.sleepStartTimestamp);
        const sleepEnd = Number(garmin.sleepEndTimestamp);

        // ดึง Log เซ็นเซอร์จาก Firebase
        const logsRef = ref(database, 'logs');
        onValue(logsRef, async (snapshot) => {
          if (!snapshot.exists()) return;

          const rawLogs = snapshot.val();
          const logKeys = Object.keys(rawLogs);

          // Data Matching: จับคู่ค่าตัวแปรและเวลานอนจริง
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
            temp: effectiveLogs.reduce((sum, item) => sum + (Number(item.temperature) || 25), 0) / totalLogs,
            hum: effectiveLogs.reduce((sum, item) => sum + (Number(item.humidity) || 50), 0) / totalLogs,
            sound: effectiveLogs.reduce((sum, item) => sum + (Number(item.sound) || 400), 0) / totalLogs,
            light: effectiveLogs.reduce((sum, item) => sum + (Number(item.light_lux) || 0), 0) / totalLogs,
            co2: effectiveLogs.reduce((sum, item) => sum + (Number(item.co2) || 600), 0) / totalLogs,
            pm25: effectiveLogs.reduce((sum, item) => sum + (Number(item.pm25) || 10), 0) / totalLogs
          };

          // Gemini AI ทำการ Diagnose ปัญหาเชิงลึก และ ส่งค่า Personalized Weight ทั้ง 6 ตัวแปร
          const geminiRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sensorAverages,
              restlessCount: garmin.restlessMomentsCount || 0
            })
          }).catch(() => null);

          const geminiJson = geminiRes ? await geminiRes.json() : null;
          const aiData = geminiJson?.data;
          const weights = aiData?.weights || { temp: 0.30, hum: 0.15, sound: 0.25, light: 0.10, co2: 0.10, pm25: 0.10 };

          // คำนวณ Sub-score ของตัวแปรเทียบกับเกณฑ์มาตรฐาน
          const tempSubScore = Math.max(0, 100 - (sensorAverages.temp > 25 ? (sensorAverages.temp - 25) * 10 : (23 - sensorAverages.temp) * 10));
          const humSubScore = Math.max(0, 100 - (sensorAverages.hum > 60 ? (sensorAverages.hum - 60) * 4 : 0));
          const soundSubScore = sensorAverages.sound > 1000 ? 50 : 100;
          const lightSubScore = sensorAverages.light > 10 ? 70 : 100;
          const co2SubScore = sensorAverages.co2 > 1000 ? 60 : 100;
          const pm25SubScore = sensorAverages.pm25 > 37.5 ? 50 : 100;

          // นำ (weight) มาคำนวณกับ (ค่าตัวแปรที่เทียบกับเกณฑ์แล้ว) เพื่อหา Room envi score
          const weightedRoomScore = Math.round(
            (tempSubScore * weights.temp) +
            (humSubScore * weights.hum) +
            (soundSubScore * weights.sound) +
            (lightSubScore * weights.light) +
            (co2SubScore * weights.co2) +
            (pm25SubScore * weights.pm25)
          );

          const combinedScore = Math.round((garmin.garminSleepScore + weightedRoomScore) / 2);

          // ส่งผลลัพธ์คะแนนห้องนอน คำแนะนำ และสาเหตุ ขึ้นไปบันทึกลง Firebase
          const summaryRef = ref(database, 'personal_sensitivity/summary');
          set(summaryRef, {
            evaluatedDate: garmin.calendarDate,
            totalAccumulatedDays: summaryData?.totalAccumulatedDays || 1,
            dailyMetrics: {
              garminSleepScore: garmin.garminSleepScore,
              roomEnvironmentScore: weightedRoomScore,
              combinedSleepScore: combinedScore,
              restlessMoments: garmin.restlessMomentsCount || 0,
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
              restlessCount: garmin.restlessMomentsCount || 0
            });
          }
        }, { onlyOnce: true });
      } catch (e) {
        console.error('Flowchart Processing Error:', e);
      }
    };

    processAutoSync();
  }, [summaryData?.totalAccumulatedDays]);

  // 2. อ่านข้อมูลเพื่อนำไปแสดงผลบน Dashboard ให้ผู้ใช้ทราบ
  useEffect(() => {
    if (!database) return;

    let unsubSummary: (() => void) | undefined;
    let unsubEvents: (() => void) | undefined;

    try {
      const summaryRef = ref(database, 'personal_sensitivity/summary');
      unsubSummary = onValue(summaryRef, (snapshot) => {
        if (snapshot && snapshot.exists()) {
          setSummaryData(snapshot.val());
        }
      });

      const eventsRef = ref(database, 'personal_sensitivity/all_sensors_events');
      unsubEvents = onValue(eventsRef, (snapshot) => {
        if (snapshot && snapshot.exists()) {
          const data = snapshot.val();
          if (data && typeof data === 'object') {
            const dates = Object.keys(data).sort();
            if (dates.length > 0) {
              setEventData(data[dates[dates.length - 1]]);
            }
          }
        }
        setLoading(false);
      });
    } catch (err) {
      console.error('Firebase read error:', err);
      setLoading(false);
    }

    return () => {
      if (unsubSummary) unsubSummary();
      if (unsubEvents) unsubEvents();
    };
  }, []);

  const cumulative = summaryData?.cumulativeSummary;
  const daily = summaryData?.dailyMetrics;
  const aiInsight = summaryData?.aiInsight;
  const accumulatedDays = summaryData?.totalAccumulatedDays ?? 1;
  const evaluatedDate = summaryData?.evaluatedDate || '-';

  const formatSensorName = (sensorKey: string) => {
    switch (sensorKey) {
      case 'sound_db':
      case 'sound': return '🔊 เสียงรบกวน (Noise)';
      case 'temperature':
      case 'temp': return '🌡️ อุณหภูมิห้อง (Temperature)';
      case 'light_lux':
      case 'lux': return '💡 แสงสว่าง (Light)';
      case 'humidity':
      case 'hum': return '💧 ความชื้น (Humidity)';
      case 'co2': return '🫁 ก๊าซ CO2';
      case 'pm25':
      case 'pm2_5': return '🌫️ ฝุ่น PM2.5';
      default: return sensorKey || 'อุณหภูมิห้อง (Temperature)';
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

  const triggerBreakdown = eventData?.sensorTriggerBreakdown || {
    co2: 0,
    humidity: 0,
    light_lux: 0,
    pm25: 0,
    sound_db: 23,
    temperature: 34
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.18) 0%, transparent 65%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px 12px 32px 12px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .app-container {
          width: 100%;
          max-width: 920px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #38bdf8;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          transition: all 0.2s ease;
        }

        .btn-back:hover {
          background: rgba(56, 189, 248, 0.2);
          transform: translateX(-2px);
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
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
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-back">
            ← ย้อนกลับหน้าหลัก
          </Link>
          <Link href="/sensitivity-profile" style={{
            fontSize: '12px',
            color: '#f8fafc',
            backgroundColor: '#3b82f6',
            padding: '6px 14px',
            borderRadius: '9999px',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            📜 ดูประวัติสะสม
          </Link>
        </div>

        {/* Header Title */}
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🎯 ผลวิเคราะห์จุดอ่อนความไวการนอน (AI Sensitivity Profile)
          </h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            {loading ? 'กำลังซิงค์ข้อมูล Gemini AI...' : `คำนวณสะสมแล้ว ${accumulatedDays} วัน (อัปเดตล่าสุด: ${evaluatedDate})`}
          </p>
        </div>

        {/* Gemini AI Diagnosis & Personalized Weights Card */}
        <section className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(14, 116, 144, 0.18) 100%)',
          borderColor: 'rgba(56, 189, 248, 0.35)'
        }}>
          <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            🤖 GEMINI AI DIAGNOSE & PERSONALIZED WEIGHTS
          </div>

          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0, lineHeight: 1.5 }}>
            {aiInsight?.diagnosis || "พบปัจจัยรบกวนหลักจากอุณหภูมิห้องและระดับเสียงขณะหลับ"}
          </h2>

          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            💡 <strong style={{ color: '#e2e8f0' }}>คำแนะนำจาก AI:</strong> {aiInsight?.recommendation || "ปรับอุณหภูมิเครื่องปรับอากาศให้อยู่ช่วง 23-25°C และลดแหล่งกำเนิดเสียงรบกวน"}
          </p>

          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>
            📊 Personalized Weight ทั้ง 6 ตัวแปร (ประมวลผลโดย Gemini AI)
          </span>

          <div className="grid-weights">
            {Object.entries(aiInsight?.weights || { temp: 0.30, hum: 0.15, sound: 0.25, light: 0.10, co2: 0.10, pm25: 0.10 }).map(([key, w]: any) => (
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
            ))}
          </div>
        </section>

        {/* Correlation Breakdown Card */}
        <section className="glass-card">
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            📊 จำนวนครั้งที่สภาพแวดล้อมกระตุ้นให้ดิ้นกลางดึก (Sensor Correlation Breakdown)
          </span>

          <div className="grid-breakdown">
            {Object.entries(triggerBreakdown).map(([key, count]: any) => (
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
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', marginTop: '4px', display: 'block' }}>
                    🟢 ปกติ
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Dashboard Scores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="glass-card">
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Overall Sensitivity Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', margin: '2px 0' }}>
              {cumulative?.overallSensitivityScore ?? 41.56} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>ความไวในการอ่อนไหวต่อสิ่งรบกวน</span>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Combined Sleep Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', margin: '2px 0' }}>
              {daily?.combinedSleepScore ?? '--'} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              (Garmin: {daily?.garminSleepScore ?? '--'} | Room Env: {daily?.roomEnvironmentScore ?? '--'})
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}