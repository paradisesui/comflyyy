'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function PersonaPage() {
  const [garminData, setGarminData] = useState<any>(null);
  const [latestDate, setLatestDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }

    const garminRef = ref(database, 'garmin_sleep');
    const unsubscribe = onValue(garminRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const dates = Object.keys(val).sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );

        if (dates.length > 0) {
          const newest = dates[0];
          setLatestDate(newest);
          setGarminData(val[newest]);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const score = garminData?.garminSleepScore ?? '--';
  const dateStr = latestDate || garminData?.calendarDate || '--';
  const restlessCount = garminData?.restlessMomentsCount ?? 0;
  const sleepStress = garminData?.avgSleepStress ?? 0;

  // คำนวณระยะเวลานอนจริงตามวินาทีที่ Garmin บันทึกไว้จริงแบบ Dynamic
  const deepSleepSecs = Number(garminData?.deepSleepDurationInSeconds || 0);
  const remSleepSecs = Number(garminData?.remSleepDurationInSeconds || 0);
  const lightSleepSecs = Number(garminData?.lightSleepDurationInSeconds || 0);
  const totalSleepSecs = Number(garminData?.durationInSeconds || (deepSleepSecs + remSleepSecs + lightSleepSecs));

  const totalHours = Math.floor(totalSleepSecs / 3600);
  const totalMinutes = Math.floor((totalSleepSecs % 3600) / 60);

  const deepPct = totalSleepSecs > 0 ? Math.round((deepSleepSecs / totalSleepSecs) * 100) : 0;
  const remPct = totalSleepSecs > 0 ? Math.round((remSleepSecs / totalSleepSecs) * 100) : 0;
  const lightPct = totalSleepSecs > 0 ? Math.round((lightSleepSecs / totalSleepSecs) * 100) : 0;

  const deepHrs = Math.floor(deepSleepSecs / 3600);
  const deepMins = Math.floor((deepSleepSecs % 3600) / 60);
  const remHrs = Math.floor(remSleepSecs / 3600);
  const remMins = Math.floor((remSleepSecs % 3600) / 60);
  const lightHrs = Math.floor(lightSleepSecs / 3600);
  const lightMins = Math.floor((lightSleepSecs % 3600) / 60);

  // ประเมินสถานะการนอนตามคะแนนจริง
  const getScoreAssessment = (s: number | string) => {
    const num = Number(s);
    if (isNaN(num)) return { label: 'กำลังรอข้อมูล...', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' };
    if (num >= 80) return { label: '🟢 การนอนฟื้นตัวดีเยี่ยม', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.3)' };
    if (num >= 65) return { label: '🟡 คุณภาพการนอนอยู่ในเกณฑ์ปกติ', color: '#facc15', bg: 'rgba(250, 204, 21, 0.12)', border: 'rgba(250, 204, 21, 0.3)' };
    return { label: '🔴 การนอนหลับต่ำกว่าเกณฑ์', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' };
  };

  const assessment = getScoreAssessment(score);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '48px 16px 48px 16px',
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

        .progress-bar-bg {
          width: 100%;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
        }
      `}</style>

      <main className="container">
        <Link href="/" className="btn-back-glow">
          <div className="arrow-badge">←</div>
          <span>กลับหน้าหลัก</span>
        </Link>

        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🧠 วิเคราะห์โครงสร้างและพฤติกรรมการนอน (Sleep Persona)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            {loading ? 'กำลังซิงค์ข้อมูล Garmin...' : `ประจำวันที่ ${dateStr} (คะแนนคุณภาพการนอน: ${score} / 100)`}
          </p>
        </div>

        {/* Overview Architecture */}
        <section className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(14, 116, 144, 0.25) 100%)',
          borderColor: 'rgba(56, 189, 248, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.8px' }}>
                OVERALL SLEEP DURATION
              </span>
              <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '4px 0', color: '#f8fafc' }}>
                {totalHours} <span style={{ fontSize: '18px', color: '#94a3b8', fontWeight: '600' }}>ชั่วโมง</span> {totalMinutes} <span style={{ fontSize: '18px', color: '#94a3b8', fontWeight: '600' }}>นาที</span>
              </h2>
            </div>
            <span style={{
              fontSize: '12px',
              color: assessment.color,
              backgroundColor: assessment.bg,
              padding: '6px 16px',
              borderRadius: '9999px',
              border: `1px solid ${assessment.border}`,
              fontWeight: '700'
            }}>
              {assessment.label}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            {totalSleepSecs > 0
              ? `ระดับความเครียดเฉลี่ยขณะนอนหลับอยู่ที่ ${sleepStress} / 100 และมีช่วงเวลาขยับตัว ${restlessCount} ครั้งตลอดคืน`
              : 'กำลังรอการซิงค์ข้อมูลระยะเวลาการนอนจากระบบ'}
          </p>
        </section>

        {/* Stages Breakdown */}
        <section className="glass-card">
          <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '800' }}>
            📊 สัดส่วนระยะการนอนหลับเทียบเกณฑ์มาตรฐาน (AASM Standards)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#38bdf8', fontWeight: '700' }}>🌊 หลับสนิท (Deep)</span>
                <span style={{ color: '#94a3b8' }}>{deepHrs}h {deepMins}m</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc', marginBottom: '6px' }}>{deepPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${Math.min(deepPct * 2, 100)}%`, height: '100%', backgroundColor: '#38bdf8' }}></div>
              </div>
              <span style={{ fontSize: '11px', color: deepPct >= 15 ? '#34d399' : '#facc15', marginTop: '6px', display: 'block' }}>
                {deepPct >= 15 ? '🟢 อยู่ในเกณฑ์ดี (15-25%)' : '🟡 ต่ำกว่าเกณฑ์มาตรฐาน'}
              </span>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#a855f7', fontWeight: '700' }}>🧠 หลับฝัน (REM)</span>
                <span style={{ color: '#94a3b8' }}>{remHrs}h {remMins}m</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc', marginBottom: '6px' }}>{remPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${Math.min(remPct * 2, 100)}%`, height: '100%', backgroundColor: '#a855f7' }}></div>
              </div>
              <span style={{ fontSize: '11px', color: remPct >= 20 ? '#34d399' : '#facc15', marginTop: '6px', display: 'block' }}>
                {remPct >= 20 ? '🟢 ฟื้นฟูความจำเยี่ยม (>20%)' : '🟡 ต่ำกว่าเกณฑ์มาตรฐาน'}
              </span>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#facc15', fontWeight: '700' }}>💤 หลับตื้น (Light)</span>
                <span style={{ color: '#94a3b8' }}>{lightHrs}h {lightMins}m</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc', marginBottom: '6px' }}>{lightPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${Math.min(lightPct, 100)}%`, height: '100%', backgroundColor: '#facc15' }}></div>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'block' }}>
                เกณฑ์มาตรฐาน (50-60%)
              </span>
            </div>
          </div>
        </section>

        {/* Stress & Movement Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="glass-card">
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>ระดับความเครียดเฉลี่ยขณะหลับ</span>
            <strong style={{ fontSize: '28px', color: '#34d399', margin: '4px 0', fontWeight: '900' }}>
              {sleepStress} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </strong>
            <span style={{ fontSize: '11px', color: sleepStress <= 25 ? '#34d399' : '#facc15' }}>
              {sleepStress <= 25 ? '🟢 ร่างกายผ่อนคลายระดับดีเยี่ยม' : '🟡 มีความเครียดสะสมปานกลาง'}
            </span>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>จำนวนช่วงเวลาการขยับตัว</span>
            <strong style={{ fontSize: '28px', color: '#38bdf8', margin: '4px 0', fontWeight: '900' }}>
              {restlessCount} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '400' }}>ครั้ง</span>
            </strong>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>การดิ้น/กระสับกระส่ายกลางดึก</span>
          </div>
        </div>
      </main>
    </div>
  );
}