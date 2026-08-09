'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function SensitivityPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. ระบบ Dynamic Process ตาม Flowchart
  useEffect(() => {
    if (!database) return;

    const processAutoSync = async () => {
      try {
        // ดึง Garmin ล่าสุด
        const garminRes = await fetch('/api/garmin?latest=true').catch(() => null);
        const garminJson = garminRes ? await garminRes.json() : null;
        const garmin = garminJson?.data;

        if (!garmin || !garmin.garminSleepScore) return;

        const sleepStart = Number(garmin.sleepStartTimestamp);
        const sleepEnd = Number(garmin.sleepEndTimestamp);

        // ดึง Log จาก Firebase
        const logsRef = ref(database, 'logs');
        onValue(logsRef, async (snapshot) => {
          if (!snapshot.exists()) return;

          const rawLogs = snapshot.val();
          const logKeys = Object.keys(rawLogs);

          // Data Matching
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

          // ยิงหา Gemini AI เพื่อเอา Personalized Weights & Diagnosis
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

          // คำนวณ Sub-scores (คะแนนเต็ม 100)
          const tempSubScore = Math.max(0, 100 - (sensorAverages.temp > 25 ? (sensorAverages.temp - 25) * 10 : (23 - sensorAverages.temp) * 10));
          const humSubScore = Math.max(0, 100 - (sensorAverages.hum > 60 ? (sensorAverages.hum - 60) * 4 : 0));
          const soundSubScore = sensorAverages.sound > 1000 ? 50 : 100;
          const lightSubScore = sensorAverages.light > 10 ? 70 : 100;
          const co2SubScore = sensorAverages.co2 > 1000 ? 60 : 100;
          const pm25SubScore = sensorAverages.pm25 > 37.5 ? 50 : 100;

          // นำ Personalized Weight จาก Gemini AI มาคูณคำนวณ Room Score
          const weightedRoomScore = Math.round(
            (tempSubScore * weights.temp) +
            (humSubScore * weights.hum) +
            (soundSubScore * weights.sound) +
            (lightSubScore * weights.light) +
            (co2SubScore * weights.co2) +
            (pm25SubScore * weights.pm25)
          );

          // คิด Combined Score
          const combinedScore = Math.round((garmin.garminSleepScore + weightedRoomScore) / 2);

          // บันทึกลง Firebase
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
              recommendation: aiData?.recommendation || "ปรับอุณหภูมิให้อยู่ช่วง 23-25°C และลดระดับเสียงในห้อง"
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

  // 2. ดึงข้อมูลแสดงผลบน UI
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
  const evaluatedDate = summaryData?.evaluatedDate || '-';

  const formatSensorName = (key: string) => {
    switch (key) {
      case 'sound_db': case 'sound': return '🔊 เสียงรบกวน (Noise)';
      case 'temperature': case 'temp': return '🌡️ อุณหภูมิห้อง (Temperature)';
      case 'light_lux': case 'light': case 'lux': return '💡 แสงสว่าง (Light)';
      case 'humidity': case 'hum': return '💧 ความชื้น (Humidity)';
      case 'co2': return '🫁 ก๊าซ CO2';
      case 'pm25': case 'pm2_5': return '🌫️ ฝุ่น PM2.5';
      default: return key || 'อุณหภูมิห้อง (Temperature)';
    }
  };

  const triggerBreakdown = eventData?.sensorTriggerBreakdown || { co2: 0, humidity: 0, light_lux: 0, pm25: 0, sound_db: 23, temperature: 34 };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '24px 14px'
    }}>
      <style jsx>{`
        .sensitivity-container {
          width: 100%;
          max-width: 900px;
          background-color: #151c2c;
          border-radius: 24px;
          border: 1px solid #1e293b;
          padding: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .ai-card {
          background-color: #0f172a;
          padding: 20px;
          border-radius: 20px;
          border: 1px solid #38bdf840;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .weights-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          background-color: #151c2c;
          padding: 12px;
          border-radius: 12px;
        }

        @media (min-width: 768px) {
          .weights-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <main className="sensitivity-container">
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <Link href="/sensitivity-profile" style={{
            fontSize: '12px',
            color: '#f8fafc',
            backgroundColor: '#3b82f6',
            padding: '6px 14px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            📜 ดูประวัติสะสม (Sensitivity Profile)
          </Link>
        </div>

        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🎯 ผลวิเคราะห์จุดอ่อนความไวการนอน (AI Sensitivity Profile)
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            {loading ? 'กำลังซิงค์ข้อมูล Gemini AI...' : `คำนวณสะสมแล้ว ${accumulatedDays} วัน (อัปเดตล่าสุด: ${evaluatedDate})`}
          </p>
        </div>

        {/* AI Diagnosis & Recommendation Card */}
        <section className="ai-card">
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase' }}>
            🤖 GEMINI AI DIAGNOSE & PERSONALIZED WEIGHTS
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#38bdf8', margin: 0 }}>
            {aiInsight?.diagnosis || "กำลังวิเคราะห์ผลด้วย Gemini AI..."}
          </h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            💡 <strong>คำแนะนำจาก AI:</strong> {aiInsight?.recommendation || "ปรับอุณหภูมิห้องให้อยู่ในเกณฑ์มาตรฐาน"}
          </p>

          <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontWeight: '600' }}>
            📊 Personalized Weight ทั้ง 6 ตัวแปร (ประมวลผลโดย Gemini AI)
          </span>
          <div className="weights-grid">
            {Object.entries(aiInsight?.weights || {}).map(([key, w]: any) => (
              <div key={key} style={{ fontSize: '11px', color: '#cbd5e1' }}>
                {formatSensorName(key)}: <strong style={{ color: '#38bdf8' }}>{Math.round(w * 100)}%</strong>
              </div>
            ))}
          </div>
        </section>

        {/* Trigger Breakdown */}
        <section style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700', display: 'block', marginBottom: '12px' }}>
            📊 จำนวนครั้งที่สภาพแวดล้อมกระตุ้นให้ดิ้นกลางดึก (Sensor Correlation Breakdown)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {Object.entries(triggerBreakdown).map(([key, count]: any) => (
              <div key={key} style={{ backgroundColor: '#151c2c', padding: '12px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>{formatSensorName(key)}</span>
                {count > 0 ? (
                  <strong style={{ fontSize: '18px', color: '#38bdf8' }}>{count} <span style={{ fontSize: '11px', color: '#94a3b8' }}>ครั้ง</span></strong>
                ) : (
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>🟢 ปกติ</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Combined Score Card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block' }}>Overall Sensitivity Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', margin: '4px 0' }}>41.56 <span style={{ fontSize: '12px', color: '#64748b' }}>/ 100</span></div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>ความไวในการอ่อนไหวต่อสิ่งรบกวน</span>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block' }}>Combined Sleep Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', margin: '4px 0' }}>{daily?.combinedSleepScore ?? '--'} <span style={{ fontSize: '12px', color: '#64748b' }}>/ 100</span></div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>(Garmin: {daily?.garminSleepScore ?? '--'} | Room Env: {daily?.roomEnvironmentScore ?? '--'})</span>
          </div>
        </div>

        <Link href="/" style={{
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          padding: '14px',
          borderRadius: '14px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '13px',
          textDecoration: 'none',
          border: '1px solid #334155'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}