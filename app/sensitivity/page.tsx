'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function SensitivityPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [latestDate, setLatestDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }

    // 1. ดึงข้อมูล Event จาก Node ที่เพิ่งประมวลผลมาหาวันล่าสุด
    const eventsRef = ref(database, 'personal_sensitivity/all_sensors_events');
    const unsubEvents = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dates = Object.keys(data).sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );

        if (dates.length > 0) {
          const newestDate = dates[0];
          setLatestDate(newestDate);
          setEventData(data[newestDate]);
        }
      }
    });

    // 2. ดึงข้อมูล Summary สำหรับคะแนนรวม
    const summaryRef = ref(database, 'personal_sensitivity/summary');
    const unsubSummary = onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) {
        setSummaryData(snapshot.val());
      }
      setLoading(false);
    });

    return () => {
      unsubEvents();
      unsubSummary();
    };
  }, []);

  const triggerBreakdown = eventData?.sensorTriggerBreakdown || {};
  const restlessCount = eventData?.totalRestlessMoments ?? summaryData?.restlessCount ?? 0;
  const sensitivityScore = eventData?.overallSensitivityScore ?? (restlessCount > 0 ? Number(((restlessCount / 40) * 100).toFixed(1)) : '--');

  // จัดอันดับเซนเซอร์ที่เป็นตัวกระตุ้นหลัก
  const sortedTriggers = Object.entries(triggerBreakdown).sort(([, a]: any, [, b]: any) => Number(b) - Number(a));
  const top1 = sortedTriggers[0];
  const top2 = sortedTriggers[1];

  const formatSensorName = (key: string) => {
    switch (key) {
      case 'sound_db': case 'sound': case 'noise': return 'เสียงรบกวน (Noise)';
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

        .btn-back-glow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #ffffff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          padding: 8px 20px 8px 12px;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.5) 0%, rgba(37, 99, 235, 0.7) 100%);
          border: 1.5px solid rgba(56, 189, 248, 0.6);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          width: fit-content;
          white-space: nowrap;
        }

        .btn-back-glow:hover {
          transform: translateY(-2px) scale(1.02);
          border-color: #38bdf8;
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.55), 0 8px 20px rgba(0, 0, 0, 0.4);
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.7) 0%, rgba(37, 99, 235, 0.9) 100%);
        }

        .arrow-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          line-height: 1;
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
          <Link href="/" className="btn-back-glow">
            <div className="arrow-badge">←</div>
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>

        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🎯 ผลวิเคราะห์จุดอ่อนความไวการนอน (AI Sensitivity Profile)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            {loading ? 'กำลังโหลดข้อมูล...' : `วิเคราะห์ Minute-by-Minute Data Matching ประจำวันที่ ${latestDate || '--'}`}
          </p>
        </div>

        {/* AI Trigger Analysis */}
        <section className="glass-card" style={{
          borderColor: 'rgba(234, 179, 8, 0.45)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(120, 53, 15, 0.2) 100%)'
        }}>
          <span style={{ fontSize: '12px', color: '#facc15', fontWeight: '900', letterSpacing: '0.8px' }}>
            ⚡ การวิเคราะห์จาก AI: สิ่งรบกวนที่กระตุ้นร่างกายให้ดิ้นตื่นมากที่สุด (PRIMARY SENSITIVITY TRIGGER)
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fef08a', margin: 0, lineHeight: 1.6 }}>
            {top1 && Number(top1[1]) > 0 ? (
              <>
                จากการวิเคราะห์พบว่า <span style={{ color: '#f43f5e' }}>{formatSensorName(top1[0])}</span>
                {top2 && Number(top2[1]) > 0 && (
                  <> และ <span style={{ color: '#38bdf8' }}>{formatSensorName(top2[0])}</span></>
                )} เป็นสิ่งรบกวนหลักที่สัมพันธ์กับช่วงที่ร่างกายเกิดการขยับตัว ({restlessCount} ครั้ง)
              </>
            ) : (
              `สภาพแวดล้อมห้องนอนอยู่ในเกณฑ์ปกติ มีการขยับตัวระหว่างนอนรวม ${restlessCount} ครั้ง`
            )}
          </h2>
        </section>

        {/* Correlation Breakdown Grid */}
        <section className="glass-card">
          <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '800' }}>
            📊 จำนวนครั้งที่สภาพแวดล้อมกระตุ้นให้ดิ้นกลางดึก (Sensor Correlation Breakdown)
          </span>
          <div className="breakdown-grid">
            {Object.entries(triggerBreakdown).map(([key, count]: any) => (
              <div key={key} style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                padding: '16px',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  {formatSensorName(key)}
                </span>
                {Number(count) > 0 ? (
                  <strong style={{ fontSize: '22px', color: '#38bdf8' }}>
                    {count} <span style={{ fontSize: '12px', color: '#64748b' }}>ครั้ง</span>
                  </strong>
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
              {sensitivityScore} <span style={{ fontSize: '14px', color: '#64748b' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>ดัชนีความไวต่อสิ่งรบกวนรอบตัว</span>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>Combined Sleep Score</span>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#38bdf8', margin: '4px 0' }}>
              {summaryData?.combinedScore ?? 73} <span style={{ fontSize: '14px', color: '#64748b' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              (Garmin: {summaryData?.garminScore ?? 65} | Room Env: {summaryData?.roomScore ?? 80})
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}