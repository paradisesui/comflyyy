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
          <span> </span>
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
                7 <span style={{ fontSize: '18px', color: '#94a3b8', fontWeight: '600' }}>ชั่วโมง</span> 45 <span style={{ fontSize: '18px', color: '#94a3b8', fontWeight: '600' }}>นาที</span>
              </h2>
            </div>
            <span style={{
              fontSize: '12px',
              color: '#34d399',
              backgroundColor: 'rgba(52, 211, 153, 0.12)',
              padding: '6px 16px',
              borderRadius: '9999px',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              fontWeight: '700'
            }}>
              🟢 การนอนฟื้นตัวดีเยี่ยม
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            การนอนหลับของคุณมีคุณภาพดีมาก ร่างกายได้รับการเติมพลังอย่างเต็มที่ สมองผ่อนคลายและมีความเครียดสะสมขณะหลับต่ำมาก (Stress Score: {sleepStress})
          </p>
        </section>

        {/* Stages Breakdown */}
        <section className="glass-card">
          <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '800' }}>
            📊 สัดส่วนระยะการนอนหลับเทียบเกณฑ์มาตรฐาน (AASM Standards)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#38bdf8', fontWeight: '700' }}>🌊 หลับสนิท (Deep)</span>
                <span style={{ color: '#94a3b8' }}>1 ชั่วโมง 22 นาที</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc', marginBottom: '6px' }}>{deepPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${deepPct * 2}%`, height: '100%', backgroundColor: '#38bdf8' }}></div>
              </div>
              <span style={{ fontSize: '11px', color: '#34d399', marginTop: '6px', display: 'block' }}>🟢 อยู่ในเกณฑ์ดี (15-25%)</span>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#a855f7', fontWeight: '700' }}>🧠 หลับฝัน (REM)</span>
                <span style={{ color: '#94a3b8' }}>2 ชั่วโมง 05 นาที</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc', marginBottom: '6px' }}>{remPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${remPct * 2}%`, height: '100%', backgroundColor: '#a855f7' }}></div>
              </div>
              <span style={{ fontSize: '11px', color: '#34d399', marginTop: '6px', display: 'block' }}>🟢 ฟื้นฟูความจำเยี่ยม (&gt;20%)</span>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#facc15', fontWeight: '700' }}>💤 หลับตื้น (Light)</span>
                <span style={{ color: '#94a3b8' }}>4 ชั่วโมง 18 นาที</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#f8fafc', marginBottom: '6px' }}>{lightPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${lightPct}%`, height: '100%', backgroundColor: '#facc15' }}></div>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'block' }}>อยู่ในเกณฑ์ปกติ (50-60%)</span>
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
            <span style={{ fontSize: '11px', color: '#34d399' }}>🟢 ร่างกายผ่อนคลายระดับดีเยี่ยม</span>
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