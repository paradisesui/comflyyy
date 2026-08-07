'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ref, onValue } from 'firebase/database';
import { database as db } from '../lib/firebase';

export default function SensitivityPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. ดึงข้อมูลสรุปสะสมภาพรวม
    const summaryRef = ref(db, 'personal_sensitivity/summary');
    const unsubSummary = onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) {
        setSummaryData(snapshot.val());
      }
    });

    // 2. ดึงข้อมูลการจับคู่ Event ระดับนาทีรายเซ็นเซอร์
    const eventsRef = ref(db, 'personal_sensitivity/all_sensors_events');
    const unsubEvents = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // ดึงข้อมูลของวันที่ล่าสุด
        const dates = Object.keys(data).sort();
        const latestDate = dates[dates.length - 1];
        setEventData(data[latestDate]);
      }
      setLoading(false);
    });

    return () => {
      unsubSummary();
      unsubEvents();
    };
  }, []);

  const cumulative = summaryData?.cumulativeSummary;
  const daily = summaryData?.dailyMetrics;
  const accumulatedDays = summaryData?.totalAccumulatedDays || 0;
  const evaluatedDate = summaryData?.evaluatedDate || '-';

  // ตัวแปลภาษาเซ็นเซอร์
  const formatSensorName = (sensorKey: string) => {
    switch (sensorKey) {
      case 'sound_db': return '🔊 เสียงรบกวน (Noise)';
      case 'temperature': return '🌡️ อุณหภูมิห้อง (Temperature)';
      case 'light_lux': return '💡 แสงสว่าง (Light)';
      case 'humidity': return '💧 ความชื้น (Humidity)';
      case 'co2': return '🫁 ก๊าซ CO2';
      case 'pm25': return '🌫️ ฝุ่น PM2.5';
      default: return sensorKey || 'ไม่พบปัจจัยกระตุ้น';
    }
  };

  const triggerBreakdown = eventData?.sensorTriggerBreakdown || {};

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
          position: relative;
          overflow: hidden;
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
        {/* Header */}
        <div className="header-box">
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            MINUTE-BY-MINUTE SENSOR ANALYSIS
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🎯 ผลวิเคราะห์จุดอ่อนความไวการนอน (AI Sensitivity Profile)
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            {loading ? 'กำลังคำนวณข้อมูลจาก Firebase...' : `คำนวณสะสมแล้ว ${accumulatedDays} วัน (อัปเดตล่าสุด: ${evaluatedDate})`}
          </p>
        </div>

        {/* 1. แสดงผลปัจจัยหลักจาก Timestamp Event Correlation */}
        <section className="main-card">
          <span style={{ fontSize: '11px', color: '#facc15', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚠️ ปัจจัยหลักที่กระตุ้นให้เกิดการดิ้น/ตื่น (Minute-by-Minute Analysis)
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fef08a', margin: 0 }}>
            {formatSensorName(eventData?.primarySensorTrigger)}
          </h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            จากการจับคู่เวลาที่ร่างกายดิ้น ({eventData?.totalRestlessEvents || 0} ครั้ง) เข้ากับเซ็นเซอร์ห้องพบว่า สภาพแวดล้อมประเภทนี้พุ่งสูงตรงกับช่วงที่คุณกำลังหลับตื้นมากที่สุด
          </p>
        </section>

        {/* 2. รายละเอียดจำนวนครั้งที่ถูกกระตุ้นแยกตามเซ็นเซอร์ */}
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
                <strong style={{ fontSize: '18px', color: (count as number) > 0 ? '#38bdf8' : '#64748b', display: 'block', marginTop: '2px' }}>
                  {count as number} <span style={{ fontSize: '11px', fontWeight: '400' }}>ครั้ง</span>
                </strong>
              </div>
            ))}
          </div>
        </section>

        {/* 3. การ์ดแสดงสถิติคะแนนความไวสะสมภาพรวม */}
        <div className="metrics-grid">
          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '600' }}>Overall Sensitivity Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', margin: '4px 0' }}>
              {cumulative?.overallSensitivityScore ?? 0} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนความไวสะสมย้อนหลัง</span>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '600' }}>Sleep Score ล่าสุด</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', margin: '4px 0' }}>
              {daily?.sleepScore ?? 0} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนคุณภาพการนอนล่าสุด</span>
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