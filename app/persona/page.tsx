'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PersonaPage() {
  const [garminData, setGarminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestGarmin = async () => {
      try {
        const res = await fetch('/api/garmin?latest=true');
        const json = await res.json();
        if (json?.data) setGarminData(json.data);
      } catch (err) {
        console.error('Error fetching Garmin:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestGarmin();
  }, []);

  const score = garminData?.garminSleepScore || 87;
  const dateStr = garminData?.calendarDate || '2026-08-09';
  const restlessCount = garminData?.restlessMomentsCount || 39;
  const sleepStress = garminData?.avgSleepStress || 8;

  const deepSleepMins = 82;
  const remSleepMins = 125;
  const lightSleepMins = 258;
  const totalSleepMins = deepSleepMins + remSleepMins + lightSleepMins;

  const deepPct = Math.round((deepSleepMins / totalSleepMins) * 100);
  const remPct = Math.round((remSleepMins / totalSleepMins) * 100);
  const lightPct = Math.round((lightSleepMins / totalSleepMins) * 100);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#05070f',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px 12px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .app-container {
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .glass-card {
          background: #0b1120;
          border: 1px solid #1e293b;
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .grid-responsive {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .progress-bar-bg {
          width: 100%;
          height: 6px;
          background-color: #1e293b;
          border-radius: 3px;
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .grid-responsive {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <main className="app-container">
        {/* Navigation Link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            ⌚ SMART WATCH & SLEEP PERSONA
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🧠 วิเคราะห์โครงสร้างการนอน (Garmin Sleep Persona)
          </h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            {loading ? 'กำลังซิงค์ Garmin...' : `ประจำวันที่ ${dateStr} (คะแนนการนอน: ${score}/100)`}
          </p>
        </div>

        {/* Overview Card */}
        <section className="glass-card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800' }}>TOTAL SLEEP DURATION</span>
              <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '2px 0', color: '#f8fafc' }}>7ชั่วโมง 45นาที</h2>
            </div>
            <span style={{ fontSize: '10px', color: '#34d399', backgroundColor: '#065f4630', padding: '4px 8px', borderRadius: '12px', border: '1px solid #34d39940' }}>
              🟢 ฟื้นตัวดีเยี่ยม
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
            การนอนหลับของคุณมีคุณภาพดีมาก ร่างกายได้รับการผ่อนคลายระดับสูง และมีความเครียดขณะหลับต่ำมาก (Stress Score: {sleepStress})
          </p>
        </section>

        {/* Stages Analysis */}
        <section className="glass-card">
          <span style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '700' }}>
            📊 สัดส่วนระยะการนอนหลับ (Sleep Stages)
          </span>

          <div className="grid-responsive">
            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#38bdf8', fontWeight: '700' }}>🌊 หลับสนิท</span>
                <span style={{ color: '#94a3b8' }}>1h 22m</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '4px' }}>{deepPct}%</div>
              <div className="progress-bar-bg"><div style={{ width: `${deepPct * 2}%`, height: '100%', backgroundColor: '#38bdf8' }}></div></div>
              <span style={{ fontSize: '9px', color: '#34d399', marginTop: '4px', display: 'block' }}>🟢 เกณฑ์ดี (15-25%)</span>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#a855f7', fontWeight: '700' }}>🧠 หลับฝัน (REM)</span>
                <span style={{ color: '#94a3b8' }}>2h 05m</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '4px' }}>{remPct}%</div>
              <div className="progress-bar-bg"><div style={{ width: `${remPct * 2}%`, height: '100%', backgroundColor: '#a855f7' }}></div></div>
              <span style={{ fontSize: '9px', color: '#34d399', marginTop: '4px', display: 'block' }}>🟢 ฟื้นฟูความจำดีเยี่ยม</span>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: '#facc15', fontWeight: '700' }}>💤 หลับตื้น</span>
                <span style={{ color: '#94a3b8' }}>4h 18m</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginBottom: '4px' }}>{lightPct}%</div>
              <div className="progress-bar-bg"><div style={{ width: `${lightPct}%`, height: '100%', backgroundColor: '#facc15' }}></div></div>
              <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>ปกติ (50-60%)</span>
            </div>
          </div>
        </section>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="glass-card">
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>ความเครียดเฉลี่ย</span>
            <strong style={{ fontSize: '20px', color: '#34d399' }}>{sleepStress} <span style={{ fontSize: '10px', color: '#64748b' }}>/ 100</span></strong>
            <span style={{ fontSize: '9px', color: '#34d399' }}>🟢 ผ่อนคลายดีมาก</span>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>จำนวนการขยับตัว</span>
            <strong style={{ fontSize: '20px', color: '#38bdf8' }}>{restlessCount} <span style={{ fontSize: '10px', color: '#64748b' }}>ครั้ง</span></strong>
            <span style={{ fontSize: '9px', color: '#94a3b8' }}>ช่วงดิ้นกลางดึก</span>
          </div>
        </div>
      </main>
    </div>
  );
}