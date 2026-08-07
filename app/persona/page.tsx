'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ref, onValue } from 'firebase/database';
// เช็ค Path ให้ตรงกับโครงสร้างโฟลเดอร์ในโปรเจกต์ของคุณ
import { database as db } from '../lib/firebase';

export default function SmartWatchPersonaPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔗 อ่านผลสรุปสะสมประจำวันจาก Firebase
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

  // ดึงข้อมูล Real Metric จาก Firebase
  const daily = summaryData?.dailyMetrics;
  const cumulative = summaryData?.cumulativeSummary;

  // คำนวณระยะเวลานอนแต่ละ Stage
  const deepMins = daily?.deepSleepMinutes || 0;
  const remMins = daily?.remSleepMinutes || 0;
  const lightMins = daily?.lightSleepMinutes || 0;
  const totalMins = deepMins + remMins + lightMins;

  // คำนวณ % สัดส่วนการนอน (Dynamic 100% ไม่มีค่าจำลอง)
  const deepPct = totalMins > 0 ? Math.round((deepMins / totalMins) * 100) : 0;
  const remPct = totalMins > 0 ? Math.round((remMins / totalMins) * 100) : 0;
  const lightPct = totalMins > 0 ? Math.max(0, 100 - deepPct - remPct) : 0;

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
  };

  // Dynamic Status Message ตามค่า Stress & Score จริง
  const getStressStatus = (stress: number) => {
    if (stress === 0) return 'ยังไม่มีข้อมูล';
    if (stress < 25) return '🟢 ความเครียดต่ำ ผ่อนคลายดี';
    if (stress < 50) return '🟡 ความเครียดปานกลาง';
    return '🔴 ความเครียดสูงขณะนอน';
  };

  const getScoreStatus = (score: number) => {
    if (score === 0) return 'ยังไม่มีข้อมูล';
    if (score >= 80) return '🟢 การนอนอยู่ในเกณฑ์ดีเยี่ยม';
    if (score >= 60) return '🟡 การนอนอยู่ในเกณฑ์ปานกลาง';
    return '🔴 การนอนควรปรับปรุง';
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

        .persona-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .sleep-stages-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        .hr-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
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
        }
      `}</style>

      <main className="persona-container">
        {/* Header */}
        <div className="header-box">
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            SMART WATCH METRICS {summaryData ? `(สะสม ${summaryData.totalAccumulatedDays} วัน)` : ''}
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            ⌚ สถิติการนอนหลับและหัวใจ (Smart Watch Sync)
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            {loading ? 'กำลังโหลดข้อมูลจาก Firebase...' : cumulative?.statusMessage || 'รายงานสัดส่วนระยะการนอนและแนวโน้มอัตราการเต้นของหัวใจจากนาฬิกาอัจฉริยะ'}
          </p>
        </div>

        <div className="persona-grid">
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
              <span style={{ fontSize: '14px', color: '#818cf8', fontWeight: '800' }}>
                📊 สัดส่วนระยะการนอนหลับ (Sleep Phase Breakdown)
              </span>
              <span style={{ fontSize: '11px', color: '#34d399', backgroundColor: '#10b98120', padding: '2px 8px', borderRadius: '8px', fontWeight: '700' }}>
                รวม {formatHoursMins(totalMins)}
              </span>
            </div>

            {/* Visual Progress Bar (Dynamic %) */}
            <div style={{ width: '100%', height: '14px', backgroundColor: '#1e293b', borderRadius: '7px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${deepPct}%`, height: '100%', backgroundColor: '#6366f1' }} title={`Deep Sleep ${deepPct}%`}></div>
              <div style={{ width: `${remPct}%`, height: '100%', backgroundColor: '#38bdf8' }} title={`REM Sleep ${remPct}%`}></div>
              <div style={{ width: `${lightPct}%`, height: '100%', backgroundColor: '#334155' }} title={`Light Sleep ${lightPct}%`}></div>
            </div>

            <div className="sleep-stages-grid">
              <div style={{ backgroundColor: '#151c2c', padding: '12px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#818cf8', display: 'block', fontWeight: '700', marginBottom: '2px' }}>● Deep Sleep</span>
                <strong style={{ fontSize: '16px', color: '#f8fafc', display: 'block' }}>{formatHoursMins(deepMins)}</strong>
                <span style={{ fontSize: '10px', color: '#64748b' }}>{deepPct}% (หลับสนิท)</span>
              </div>

              <div style={{ backgroundColor: '#151c2c', padding: '12px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#38bdf8', display: 'block', fontWeight: '700', marginBottom: '2px' }}>● REM Sleep</span>
                <strong style={{ fontSize: '16px', color: '#f8fafc', display: 'block' }}>{formatHoursMins(remMins)}</strong>
                <span style={{ fontSize: '10px', color: '#64748b' }}>{remPct}% (ช่วงฝัน)</span>
              </div>

              <div style={{ backgroundColor: '#151c2c', padding: '12px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '700', marginBottom: '2px' }}>● Light Sleep</span>
                <strong style={{ fontSize: '16px', color: '#f8fafc', display: 'block' }}>{formatHoursMins(lightMins)}</strong>
                <span style={{ fontSize: '10px', color: '#64748b' }}>{lightPct}% (หลับตื้น)</span>
              </div>
            </div>
          </section>

          {/* 2. แนวโน้มอัตราการเต้นหัวใจและ Sensitivity สะสม */}
          <section style={{
            backgroundColor: '#0f172a',
            padding: '20px',
            borderRadius: '20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '800' }}>
              ❤️ แนวโน้มอัตราการเต้นหัวใจและจุดอ่อนสะสม (Sleep & Sensitivity Trend)
            </span>

            <div className="hr-grid">
              <div style={{ backgroundColor: '#151c2c', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Sleep Stress</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#f43f5e', margin: '4px 0' }}>
                  {daily?.avgSleepStress || 0} <span style={{ fontSize: '12px', fontWeight: '400', color: '#94a3b8' }}>Score</span>
                </div>
                <span style={{ fontSize: '10px', color: '#34d399' }}>{getStressStatus(daily?.avgSleepStress || 0)}</span>
              </div>

              <div style={{ backgroundColor: '#151c2c', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Sleep Score</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#38bdf8', margin: '4px 0' }}>
                  {daily?.sleepScore || 0} <span style={{ fontSize: '12px', fontWeight: '400', color: '#94a3b8' }}>/ 100</span>
                </div>
                <span style={{ fontSize: '10px', color: '#34d399' }}>{getScoreStatus(daily?.sleepScore || 0)}</span>
              </div>

              <div style={{ backgroundColor: '#151c2c', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Sensitivity Score</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#34d399', margin: '4px 0' }}>
                  {cumulative?.overallSensitivityScore || 0}
                </div>
                <span style={{ fontSize: '10px', color: '#38bdf8' }}>⚡ ไวต่อ {cumulative?.avgRoomTemp || 0}°C</span>
              </div>
            </div>
          </section>
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