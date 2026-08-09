'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function SensitivityPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);

  useEffect(() => {
    if (!database) return;

    const summaryRef = ref(database, 'personal_sensitivity/summary');
    onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) setSummaryData(snapshot.val());
    });

    const eventsRef = ref(database, 'personal_sensitivity/all_sensors_events');
    onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dates = Object.keys(data).sort();
        if (dates.length > 0) setEventData(data[dates[dates.length - 1]]);
      }
    });
  }, []);

  const daily = summaryData?.dailyMetrics;
  const aiInsight = summaryData?.aiInsight;
  const triggerBreakdown = eventData?.sensorTriggerBreakdown || { co2: 0, humidity: 0, light_lux: 0, pm25: 0, sound_db: 23, temperature: 34 };

  const formatSensorName = (key: string) => {
    switch (key) {
      case 'sound_db': case 'sound': return 'เสียงรบกวน (Noise)';
      case 'temperature': case 'temp': return 'อุณหภูมิห้อง (Temperature)';
      case 'light_lux': case 'light': return 'แสงสว่าง (Light)';
      case 'humidity': case 'hum': return 'ความชื้น (Humidity)';
      case 'co2': return 'ก๊าซ CO2';
      case 'pm25': return 'ฝุ่น PM2.5';
      default: return key;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px 16px 48px 16px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 20px;
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
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 12px;
        }

        @media (min-width: 640px) {
          .breakdown-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <main className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-back">
            ← ย้อนกลับหน้าหลัก
          </Link>
          <Link href="/sensitivity-profile" style={{
            fontSize: '12px',
            color: '#f8fafc',
            backgroundColor: '#2563eb',
            padding: '8px 16px',
            borderRadius: '9999px',
            textDecoration: 'none',
            fontWeight: '700'
          }}>
            📜 ดูประวัติสะสม
          </Link>
        </div>

        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🎯 ผลวิเคราะห์จุดอ่อนความไวการนอน (AI Sensitivity Profile)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            วิเคราะห์พฤติกรรมการดิ้นตื่นกลางดึกร่วมกับสิ่งรบกวนรอบตัว
          </p>
        </div>

        {/* AI Diagnosis Card */}
        <section className="glass-card" style={{
          borderColor: 'rgba(234, 179, 8, 0.4)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(120, 53, 15, 0.15) 100%)'
        }}>
          <span style={{ fontSize: '12px', color: '#facc15', fontWeight: '900', letterSpacing: '0.8px' }}>
            ⚠️ ปัจจัยหลักที่กระตุ้นให้เกิดการดิ้น/ตื่น (GEMINI AI DIAGNOSIS)
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fef08a', margin: 0, lineHeight: 1.6 }}>
            {aiInsight?.diagnosis || "กำลังวิเคราะห์ปัจจัยการดิ้นตื่น..."}
          </h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            💡 <strong>คำแนะนำ AI:</strong> {aiInsight?.recommendation || "ปรับปรุงสภาพแวดล้อมห้องนอน"}
          </p>
        </section>

        {/* Breakdown Card */}
        <section className="glass-card">
          <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '800' }}>
            📊 จำนวนครั้งที่สภาพแวดล้อมกระตุ้นให้ดิ้นกลางดึก (Sensor Correlation Breakdown)
          </span>
          <div className="breakdown-grid">
            {Object.entries(triggerBreakdown).map(([key, count]: any) => (
              <div key={key} style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{formatSensorName(key)}</span>
                {count > 0 ? (
                  <strong style={{ fontSize: '22px', color: '#38bdf8' }}>{count} <span style={{ fontSize: '12px', color: '#64748b' }}>ครั้ง</span></strong>
                ) : (
                  <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '700' }}>🟢 สภาพแวดล้อมปกติ</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Scores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="glass-card">
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>Overall Sensitivity Score</span>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#34d399', margin: '4px 0' }}>
              41.56 <span style={{ fontSize: '14px', color: '#64748b' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>ความไวในการอ่อนไหวต่อสิ่งรบกวน</span>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>Combined Sleep Score</span>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#38bdf8', margin: '4px 0' }}>
              {daily?.combinedSleepScore ?? '--'} <span style={{ fontSize: '14px', color: '#64748b' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              (Garmin: {daily?.garminSleepScore ?? '--'} | Room Env: {daily?.roomEnvironmentScore ?? '--'})
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}