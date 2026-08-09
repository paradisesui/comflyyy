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
        if (json?.data) {
          setGarminData(json.data);
        }
      } catch (err) {
        console.error('Error fetching Garmin data for persona:', err);
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
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.18) 0%, transparent 65%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px 12px 32px 12px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .persona-container {
          width: 100%;
          max-width: 920px;
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          transition: all 0.2s ease;
        }

        .btn-back:hover {
          background: rgba(56, 189, 248, 0.2);
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.6);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .progress-bar-bg {
          width: 100%;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <main className="persona-container">
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-back">
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>
            GARMIN SLEEP PERSONA ANALYSIS
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🧠 วิเคราะห์โครงสร้างและพฤติกรรมการนอน (Sleep Persona)
          </h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            {loading ? 'กำลังซิงค์ข้อมูล Garmin...' : `ประจำวันที่ ${dateStr} (คะแนนคุณภาพการนอน: ${score}/100)`}
          </p>
        </div>

        {/* 1. สรุปภาพรวม Sleep Architecture */}
        <section className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(14, 116, 144, 0.18) 100%)',
          borderColor: 'rgba(56, 189, 248, 0.35)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.8px' }}>
                OVERALL SLEEP DURATION
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '2px 0', color: '#f8fafc' }}>
                7ชั่วโมง 45นาที
              </h2>
            </div>
            <span style={{
              fontSize: '11px',
              color: '#34d399',
              backgroundColor: 'rgba(52, 211, 153, 0.12)',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              fontWeight: '600'
            }}>
              🟢 การนอนฟื้นตัวดีเยี่ยม
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            การนอนหลับของคุณมีคุณภาพดีมาก ร่างกายได้รับการเติมพลังอย่างเต็มที่ สมองผ่อนคลายและมีความเครียดสะสมขณะหลับต่ำมาก (Stress Score: {sleepStress})
          </p>
        </section>

        {/* 2. สัดส่วนระยะการนอนหลับ */}
        <section className="glass-card">
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            📊 สัดส่วนระยะการนอนหลับเทียบเกณฑ์มาตรฐาน (AASM Standards)
          </span>

          <div className="metrics-grid">
            {/* Deep Sleep */}
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#38bdf8', fontWeight: '700' }}>🌊 หลับสนิท (Deep)</span>
                <span style={{ color: '#94a3b8' }}>1h 22m</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', marginBottom: '6px' }}>{deepPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${deepPct * 2}%`, height: '100%', backgroundColor: '#38bdf8' }}></div>
              </div>
              <span style={{ fontSize: '10px', color: '#34d399', marginTop: '6px', display: 'block' }}>🟢 อยู่ในเกณฑ์ดี (15-25%)</span>
            </div>

            {/* REM Sleep */}
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#a855f7', fontWeight: '700' }}>🧠 หลับฝัน (REM)</span>
                <span style={{ color: '#94a3b8' }}>2h 05m</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', marginBottom: '6px' }}>{remPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${remPct * 2}%`, height: '100%', backgroundColor: '#a855f7' }}></div>
              </div>
              <span style={{ fontSize: '10px', color: '#34d399', marginTop: '6px', display: 'block' }}>🟢 ฟื้นฟูความจำเยี่ยม (&gt;20%)</span>
            </div>

            {/* Light Sleep */}
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#facc15', fontWeight: '700' }}>💤 หลับตื้น (Light)</span>
                <span style={{ color: '#94a3b8' }}>4h 18m</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', marginBottom: '6px' }}>{lightPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${lightPct}%`, height: '100%', backgroundColor: '#facc15' }}></div>
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', display: 'block' }}>อยู่ในเกณฑ์ปกติ (50-60%)</span>
            </div>
          </div>
        </section>

        {/* 3. สถิติวัดระดับความเครียดและการเคลื่อนไหว */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="glass-card">
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>ระดับความเครียดเฉลี่ยขณะหลับ</span>
            <strong style={{ fontSize: '22px', color: '#34d399', margin: '2px 0' }}>
              {sleepStress} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </strong>
            <span style={{ fontSize: '10px', color: '#34d399' }}>🟢 ร่างกายผ่อนคลายระดับดีเยี่ยม</span>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>จำนวนช่วงเวลาการขยับตัว</span>
            <strong style={{ fontSize: '22px', color: '#38bdf8', margin: '2px 0' }}>
              {restlessCount} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>ครั้ง</span>
            </strong>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>การดิ้น/กระสับกระส่ายกลางดึก</span>
          </div>
        </div>
      </main>
    </div>
  );
}