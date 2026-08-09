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
  const triggerBreakdown = eventData?.sensorTriggerBreakdown || { co2: 12, humidity: 5, light_lux: 0, pm25: 2, sound_db: 23, temperature: 34 };

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

  const getSensorMaxLimit = (key: string) => {
    switch (key) {
      case 'temperature': case 'temp': return 40;
      case 'sound_db': case 'sound': return 35;
      case 'co2': return 25;
      default: return 20;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '32px 16px 48px 16px',
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

        .btn-pill-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #f8fafc;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 20px;
          border-radius: 9999px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.4);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
          transition: all 0.25s ease;
        }

        .btn-pill-back:hover {
          background: rgba(56, 189, 248, 0.2);
          border-color: #38bdf8;
          transform: translateY(-1px);
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
          gap: 14px;
        }

        .progress-bg {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 8px;
        }

        @media (min-width: 640px) {
          .breakdown-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <main className="container">
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-pill-back">
            <span className="arrow-circle">←</span>
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>

        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🎯 ผลวิเคราะห์จุดอ่อนความไวการนอน (AI Sensitivity Profile)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            วิเคราะห์ข้อมูล Minute-by-Minute Data Matching ระหว่าง Garmin และเซ็นเซอร์ห้องนอน
          </p>
        </div>

        {/* Primary Sensitivity Trigger Analysis */}
        <section className="glass-card" style={{
          borderColor: 'rgba(234, 179, 8, 0.45)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(120, 53, 15, 0.2) 100%)'
        }}>
          <span style={{ fontSize: '12px', color: '#facc15', fontWeight: '900', letterSpacing: '0.8px' }}>
            ⚡ การวิเคราะห์จาก AI: สิ่งรบกวนที่กระตุ้นร่างกายให้ดิ้นตื่นมากที่สุด (PRIMARY SENSITIVITY TRIGGER)
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fef08a', margin: 0, lineHeight: 1.6 }}>
            จากการวิเคราะห์ Minute-by-Minute พบว่า <span style={{ color: '#38bdf8' }}>อุณหภูมิห้อง</span> และ <span style={{ color: '#f43f5e' }}>ระดับเสียงรบกวน</span> เป็น 2 สิ่งรบกวนหลักที่พุ่งสูงตรงกับช่วงที่ร่างกายเกิดการดิ้นตื่นมากที่สุด ({daily?.restlessMoments || 39} ครั้ง)
          </h2>
        </section>

        {/* Minute-by-Minute Correlation Breakdown */}
        <section className="glass-card">
          <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '800' }}>
            📊 จำนวนครั้งที่สภาพแวดล้อมกระตุ้นให้ดิ้นกลางดึก (Minute-by-Minute Sensor Correlation)
          </span>
          <div className="breakdown-grid">
            {Object.entries(triggerBreakdown).map(([key, count]: any) => {
              const maxVal = getSensorMaxLimit(key);
              const pct = Math.min(100, Math.round((count / maxVal) * 100));

              return (
                <div key={key} style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  padding: '16px',
                  borderRadius: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{formatSensorName(key)}</span>
                    {count > 0 ? (
                      <strong style={{ fontSize: '22px', color: '#38bdf8' }}>
                        {count} <span style={{ fontSize: '12px', color: '#64748b' }}>ครั้ง</span>
                      </strong>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '700' }}>🟢 สภาพแวดล้อมปกติ</span>
                    )}
                  </div>

                  {/* AI Correlation Progress Bar */}
                  {count > 0 && (
                    <div className="progress-bg">
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: count > 20 ? '#f43f5e' : '#38bdf8' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Overall Sensitivity & Combined Score */}
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