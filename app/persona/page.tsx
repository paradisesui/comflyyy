'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ref, onValue } from 'firebase/database';
import { database } from '@/app/lib/firebase';

export default function PersonaPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) return;

    let unsubSummary: (() => void) | undefined;

    try {
      const summaryRef = ref(database, 'personal_sensitivity/summary');
      unsubSummary = onValue(
        summaryRef,
        (snapshot) => {
          if (snapshot && snapshot.exists()) {
            setSummaryData(snapshot.val());
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error reading summary:', error);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Firebase initialization error:', err);
      setLoading(false);
    }

    return () => {
      if (unsubSummary) unsubSummary();
    };
  }, []);

  const cumulative = summaryData?.cumulativeSummary;
  const daily = summaryData?.dailyMetrics;
  const accumulatedDays = summaryData?.totalAccumulatedDays ?? 1;
  const evaluatedDate = summaryData?.evaluatedDate || '-';

  // สัดส่วนระยะเวลาการนอน (นาที) พร้อมค่าสำรองหากยังไม่มีข้อมูลคืนแรก
  const deepSleepMinutes = daily?.deepSleepMinutes ?? 95;   // ~1h 35m
  const remSleepMinutes = daily?.remSleepMinutes ?? 110;     // ~1h 50m
  const lightSleepMinutes = daily?.lightSleepMinutes ?? 235;  // ~3h 55m
  const totalSleepMinutes = deepSleepMinutes + remSleepMinutes + lightSleepMinutes;

  const formatHoursMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const formatPercentage = (mins: number, total: number) => {
    if (!total) return '0%';
    return `${Math.round((mins / total) * 100)}% (สะสม)`;
  };

  // Scores ต่างๆ
  const garminScore = daily?.garminSleepScore ?? 78;
  const sleepStress = daily?.avgSleepStress ?? 24;
  const sensitivityScore = cumulative?.overallSensitivityScore ?? 41.56;
  const avgTemp = cumulative?.avgRoomTemp ?? 28.3;

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
        .persona-container {
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

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .persona-container {
            padding: 28px;
            gap: 24px;
          }
          .header-box {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          .metrics-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
      `}</style>

      <main className="persona-container">
        {/* Header Bar */}
        <div className="header-box">
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            SMART WATCH METRICS (สะสม {accumulatedDays} วัน)
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            ⌚ สถิติการนอนหลับและหัวใจ (Smart Watch Sync)
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            {loading ? 'กำลังซิงค์ข้อมูลจาก Firebase...' : `วิเคราะห์จากข้อมูลสะสม ${accumulatedDays} วัน (อัปเดตล่าสุด: ${evaluatedDate})`}
          </p>
        </div>

        {/* 1. สัดส่วนระยะการนอนหลับ (Sleep Phase Breakdown) */}
        <section style={{
          backgroundColor: '#0f172a',
          padding: '20px',
          borderRadius: '20px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: '700' }}>
              📊 สัดส่วนระยะการนอนหลับ (Sleep Phase Breakdown)
            </span>
            <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '700', backgroundColor: '#064e3b', padding: '4px 10px', borderRadius: '12px' }}>
              รวม {formatHoursMinutes(totalSleepMinutes)}
            </span>
          </div>

          <div className="metrics-grid">
            {/* Deep Sleep */}
            <div style={{ backgroundColor: '#151c2c', padding: '16px', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>• Deep Sleep</span>
              <strong style={{ fontSize: '20px', color: '#f8fafc', display: 'block', margin: '4px 0' }}>
                {formatHoursMinutes(deepSleepMinutes)}
              </strong>
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                {formatPercentage(deepSleepMinutes, totalSleepMinutes)}
              </span>
            </div>

            {/* REM Sleep */}
            <div style={{ backgroundColor: '#151c2c', padding: '16px', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>• REM Sleep</span>
              <strong style={{ fontSize: '20px', color: '#f8fafc', display: 'block', margin: '4px 0' }}>
                {formatHoursMinutes(remSleepMinutes)}
              </strong>
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                {formatPercentage(remSleepMinutes, totalSleepMinutes)}
              </span>
            </div>

            {/* Light Sleep */}
            <div style={{ backgroundColor: '#151c2c', padding: '16px', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>• Light Sleep</span>
              <strong style={{ fontSize: '20px', color: '#f8fafc', display: 'block', margin: '4px 0' }}>
                {formatHoursMinutes(lightSleepMinutes)}
              </strong>
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                {formatPercentage(lightSleepMinutes, totalSleepMinutes)}
              </span>
            </div>
          </div>
        </section>

        {/* 2. แนวโน้มอัตราการเต้นหัวใจและจุดอ่อนสะสม (Sleep & Sensitivity Trend) */}
        <section style={{
          backgroundColor: '#0f172a',
          padding: '20px',
          borderRadius: '20px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <span style={{ fontSize: '13px', color: '#f43f5e', fontWeight: '700' }}>
            ❤️ แนวโน้มอัตราการเต้นหัวใจและจุดอ่อนสะสม (Sleep & Sensitivity Trend)
          </span>

          <div className="metrics-grid">
            {/* Sleep Stress */}
            <div style={{ backgroundColor: '#151c2c', padding: '16px', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Sleep Stress</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#f43f5e', margin: '4px 0' }}>
                {sleepStress} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>Score</span>
              </div>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>
                🟢 ความพร้อมร่าง ผ่อนคลายดี
              </span>
            </div>

            {/* Sleep Score */}
            <div style={{ backgroundColor: '#151c2c', padding: '16px', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Sleep Score</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#38bdf8', margin: '4px 0' }}>
                {garminScore} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
              </div>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '600' }}>
                🟢 คุณภาพการนอนหลับดี
              </span>
            </div>

            {/* Sensitivity Score */}
            <div style={{ backgroundColor: '#151c2c', padding: '16px', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Sensitivity Score</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399', margin: '4px 0' }}>
                {sensitivityScore}
              </div>
              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>
                ⚡ ไวต่อ {avgTemp}°C
              </span>
            </div>
          </div>
        </section>

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