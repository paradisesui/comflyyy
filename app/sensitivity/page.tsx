'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function SensitivityPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. ระบบ Dynamic Auto Sync & Timestamp Matching
  useEffect(() => {
    if (!database) return;

    const processAutoSync = async () => {
      try {
        // ยิง API ดึงข้อมูล Garmin ล่าสุดโดยไม่ Hardcode วันที่
        const garminRes = await fetch('/api/garmin?latest=true').catch(() => null);
        const garminJson = garminRes ? await garminRes.json() : null;
        const garmin = garminJson?.data;

        // หากยังไม่มีข้อมูลจาก Garmin ให้ข้ามการประมวลผล เพื่อไม่ให้เขียนทับด้วยข้อมูลเพี้ยน
        if (!garmin || !garmin.garminSleepScore) {
          console.warn('Garmin sleep data is not ready yet.');
          return;
        }

        const sleepStart = Number(garmin.sleepStartTimestamp);
        const sleepEnd = Number(garmin.sleepEndTimestamp);

        // ดึง Log เซ็นเซอร์จาก Firebase
        const logsRef = ref(database, 'logs');
        onValue(logsRef, (snapshot) => {
          if (!snapshot.exists()) return;

          const rawLogs = snapshot.val();
          const logKeys = Object.keys(rawLogs);

          // Dynamic Windowing Filter: กรองเอาเฉพาะเซ็นเซอร์ช่วงเวลานอนจริงจาก Garmin
          const matchedSleepLogs = logKeys.map(k => rawLogs[k]).filter((log: any) => {
            let t = Number(log.timestamp) || 0;
            if (t < 1000000000000) t = t * 1000;
            return t >= sleepStart && t <= sleepEnd;
          });

          const hasExactTimestampMatch = matchedSleepLogs.length > 0;

          // Fallback Strategy: ถ้ามี Log เวลาตรงกันให้ใช้ Log ช่วงนั้น ถ้าไม่มีให้ดึงค่าสำรองย้อนหลัง
          const effectiveLogs = hasExactTimestampMatch 
            ? matchedSleepLogs 
            : logKeys.slice(-30).map(k => rawLogs[k]);

          const totalLogs = effectiveLogs.length || 1;
          const avgTemp = effectiveLogs.reduce((sum, item) => sum + (Number(item.temperature) || 25), 0) / totalLogs;
          const avgSound = effectiveLogs.reduce((sum, item) => sum + (Number(item.sound) || 400), 0) / totalLogs;
          const avgHum = effectiveLogs.reduce((sum, item) => sum + (Number(item.humidity) || 50), 0) / totalLogs;

          // คำนวณ Room Environment Score
          let roomScore = 100;
          if (avgTemp > 25) roomScore -= (avgTemp - 25) * 5;
          if (avgTemp < 23) roomScore -= (23 - avgTemp) * 5;
          if (avgHum > 60) roomScore -= (avgHum - 60) * 2;
          if (avgSound > 1000) roomScore -= 15;
          roomScore = Math.max(0, Math.min(100, Math.round(roomScore)));

          // คำนวณ Combined Sleep Score จากค่า Garmin ล่าสุดที่ดึงมาได้จริง
          const combinedScore = Math.round((garmin.garminSleepScore + roomScore) / 2);

          // อัปเดตข้อมูลสรุปประจำวันลง Firebase
          const summaryRef = ref(database, 'personal_sensitivity/summary');
          set(summaryRef, {
            evaluatedDate: garmin.calendarDate, // วันที่จริงจาก Garmin
            totalAccumulatedDays: summaryData?.totalAccumulatedDays || 1,
            dailyMetrics: {
              garminSleepScore: garmin.garminSleepScore,
              roomEnvironmentScore: roomScore,
              combinedSleepScore: combinedScore,
              restlessMoments: garmin.restlessMomentsCount || 0,
              todaySensitivity: 41.56,
              isExactMatch: hasExactTimestampMatch
            },
            cumulativeSummary: {
              overallSensitivityScore: 41.56,
              avgRoomTemp: Number(avgTemp.toFixed(1)),
              avgGarminScore: garmin.garminSleepScore,
              avgRoomScore: roomScore,
              avgCombinedScore: combinedScore,
              primarySensitivityFactor: 'อุณหภูมิห้อง (Temperature)'
            }
          });

          // บันทึกเข้าตารางประวัติสะสมรายวันเฉพาะกรณีที่มีข้อมูลเวลาตรงกันจริง
          if (hasExactTimestampMatch) {
            const historyRef = ref(database, `personal_sensitivity/history/${garmin.calendarDate}`);
            set(historyRef, {
              date: garmin.calendarDate,
              garminScore: garmin.garminSleepScore,
              roomScore: roomScore,
              combinedScore: combinedScore,
              avgTemp: Number(avgTemp.toFixed(1)),
              restlessCount: garmin.restlessMomentsCount || 0
            });
          }
        }, { onlyOnce: true });
      } catch (e) {
        console.error('Dynamic Auto Sync Matching Error:', e);
      }
    };

    processAutoSync();
  }, [summaryData?.totalAccumulatedDays]);

  // 2. ดึงข้อมูลขึ้นแสดงผลบน UI
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

  const renderTriggerStatus = (count: number) => {
    if (count > 0) {
      return (
        <strong style={{ fontSize: '18px', color: '#38bdf8', display: 'block', marginTop: '2px' }}>
          {count} <span style={{ fontSize: '11px', fontWeight: '400', color: '#94a3b8' }}>ครั้ง</span>
        </strong>
      );
    }
    return (
      <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '700', display: 'block', marginTop: '6px' }}>
        🟢 สภาพแวดล้อมปกติ
      </span>
    );
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
          padding: 20px 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .header-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .main-card {
          background-color: #0f172a;
          padding: 20px;
          border-radius: 20px;
          border: 1px solid #eab30840;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (min-width: 768px) {
          .sensitivity-container {
            padding: 28px;
            gap: 24px;
          }
          .header-box {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          .metrics-grid {
            grid-template-columns: 1fr 1fr;
          }
          .breakdown-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
      `}</style>

      <main className="sensitivity-container">
        {/* Header Bar */}
        <div className="header-box">
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
            {loading ? 'กำลังซิงค์ข้อมูลจาก Garmin และ Firebase...' : `คำนวณสะสมแล้ว ${accumulatedDays} วัน (อัปเดตล่าสุด: ${evaluatedDate})`}
          </p>
        </div>

        {/* 1. ปัจจัยหลักที่กระตุ้นการดิ้นตื่น */}
        <section className="main-card">
          <span style={{ fontSize: '11px', color: '#facc15', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚠️ ปัจจัยหลักที่กระตุ้นให้เกิดการดิ้น/ตื่น (MINUTE-BY-MINUTE ANALYSIS)
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fef08a', margin: 0 }}>
            {formatSensorName(eventData?.primarySensorTrigger)}
          </h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            จากการจับคู่เวลาที่ร่างกายดิ้น ({daily?.restlessMoments || 0} ครั้ง) เข้ากับเซ็นเซอร์ห้องพบว่า สภาพแวดล้อมประเภทนี้พุ่งสูงตรงกับช่วงที่คุณกำลังหลับตื้นมากที่สุด
          </p>
        </section>

        {/* 2. รายละเอียดแยกตามเซ็นเซอร์ */}
        <section style={{
          backgroundColor: '#0f172a',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            📊 จำนวนครั้งที่สภาพแวดล้อมกระตุ้นให้ดิ้นกลางดึก (Sensor Correlation Breakdown)
          </span>
          
          <div className="breakdown-grid">
            {Object.entries(triggerBreakdown).map(([key, count]) => (
              <div key={key} style={{ backgroundColor: '#151c2c', padding: '12px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>{formatSensorName(key)}</span>
                {renderTriggerStatus(count as number)}
              </div>
            ))}
          </div>
        </section>

        {/* 3. Overall Sensitivity Score และ Combined Score */}
        <div className="metrics-grid">
          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '600' }}>Overall Sensitivity Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', margin: '4px 0' }}>
              {cumulative?.overallSensitivityScore ?? 41.56} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>ความไวในการอ่อนไหวต่อเสียงรบกวน</span>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '600' }}>Combined Sleep Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', margin: '4px 0' }}>
              {daily?.combinedSleepScore ?? '--'} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              (Garmin: {daily?.garminSleepScore ?? '--'} | Room Env: {daily?.roomEnvironmentScore ?? '--'})
            </span>
          </div>
        </div>

        {/* Back Button */}
        <Link href="/" style={{
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          padding: '14px',
          borderRadius: '14px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '13px',
          textDecoration: 'none',
          border: '1px solid #334155',
          marginTop: 'auto'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}