'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ref, onValue } from 'firebase/database';
import { database as db } from '../lib/firebase';

export default function SensitivityPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔗 อ่านผลสรุปสะสมประจำวันจาก Firebase Node
    const summaryRef = ref(db, 'personal_sensitivity/summary');
    const unsubscribe = onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) {
        setSummaryData(snapshot.val());
      } else {
        setSummaryData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // อ่านค่าตรงตาม Payload ที่ Python ยิงขึ้น Firebase
  const cumulative = summaryData?.cumulativeSummary;
  const daily = summaryData?.dailyMetrics;
  const accumulatedDays = summaryData?.totalAccumulatedDays || 0;
  const evaluatedDate = summaryData?.evaluatedDate || '-';

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
        }
      `}</style>

      <main className="sensitivity-container">
        {/* Header */}
        <div className="header-box">
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            SENSOR-BASED ANALYSIS
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🎯 ผลวิเคราะห์จุดอ่อนความไวการนอน (AI Sensitivity Profile)
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            {loading ? 'กำลังคำนวณข้อมูลจาก Firebase...' : `คำนวณสะสมแล้ว ${accumulatedDays} วัน (ข้อมูลล่าสุดประจำวันที่: ${evaluatedDate})`}
          </p>
        </div>

        {/* 1. การ์ดปัจจัยหลักที่มีผลมากที่สุดสะสม */}
        <section className="main-card">
          <span style={{ fontSize: '11px', color: '#facc15', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚠️ ปัจจัยการตื่นอันดับ 1 ของคุณ (วิเคราะห์สะสม)
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fef08a', margin: 0 }}>
            {cumulative?.primarySensitivityFactor || 'อุณหภูมิห้อง (High Temp Sensitivity)'}
          </h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            {cumulative?.statusMessage || 'กำลังรอการประมวลผลข้อมูลสะสม...'}
          </p>
        </section>

        {/* 2. การ์ดแสดงสถิติคะแนนความไวและอุณหภูมิสะสม */}
        <div className="metrics-grid">
          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '600' }}>Overall Sensitivity Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', margin: '4px 0' }}>
              {cumulative?.overallSensitivityScore ?? 0} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนความไวสะสมย้อนหลัง</span>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '16px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '600' }}>Avg Room Temperature</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', margin: '4px 0' }}>
              {cumulative?.avgRoomTemp ?? 0}°C
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>อุณหภูมิห้องเฉลี่ยสะสมช่วงเวลานอน</span>
          </div>
        </div>

        {/* 3. สรุปข้อมูลล่าสุดประจำวัน */}
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
            📊 สรุปข้อมูลล่าสุดประจำวัน ({evaluatedDate})
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#151c2c', padding: '10px', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Sleep Score</span>
              <strong style={{ fontSize: '15px', color: '#f8fafc' }}>{daily?.sleepScore ?? 0}</strong>
            </div>
            <div style={{ backgroundColor: '#151c2c', padding: '10px', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>การดิ้นกลางดึก</span>
              <strong style={{ fontSize: '15px', color: '#f8fafc' }}>{daily?.restlessMoments ?? 0} ครั้ง</strong>
            </div>
            <div style={{ backgroundColor: '#151c2c', padding: '10px', borderRadius: '12px' }}>
              <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Sensitivity วันนี้</span>
              <strong style={{ fontSize: '15px', color: '#facc15' }}>{daily?.todaySensitivity ?? 0}</strong>
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