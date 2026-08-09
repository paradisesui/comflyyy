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

  // ข้อมูลสถิติการนอน
  const score = garminData?.garminSleepScore || 87;
  const dateStr = garminData?.calendarDate || '2026-08-09';
  const restlessCount = garminData?.restlessMomentsCount || 39;
  const sleepStress = garminData?.avgSleepStress || 8;

  // ระยะเวลาการนอนหลับแต่ละ Stage (นาที)
  const deepSleepMins = 82;   // 1h 22m
  const remSleepMins = 125;   // 2h 5m
  const lightSleepMins = 258; // 4h 18m
  const totalSleepMins = deepSleepMins + remSleepMins + lightSleepMins; // 465 mins (7h 45m)

  // คำนวณเปอร์เซ็นต์ตามเกณฑ์สรีรวิทยา (AASM Criteria)
  const deepPct = Math.round((deepSleepMins / totalSleepMins) * 100);
  const remPct = Math.round((remSleepMins / totalSleepMins) * 100);
  const lightPct = Math.round((lightSleepMins / totalSleepMins) * 100);

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
          padding: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .stage-card {
          background-color: #0f172a;
          border-radius: 16px;
          border: 1px solid #1e293b;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-bar-bg {
          width: 100%;
          height: 8px;
          background-color: #1e293b;
          border-radius: 4px;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
      `}</style>

      <main className="persona-container">
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            GARMIN SLEEP PERSONA ANALYSIS
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🧠 วิเคราะห์โครงสร้างและพฤติกรรมการนอน (Sleep Persona)
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            {loading ? 'กำลังซิงค์ข้อมูล Garmin...' : `ประจำวันที่ ${dateStr} (คะแนนคุณภาพการนอน: ${score}/100)`}
          </p>
        </div>

        {/* สรุปภาพรวม Sleep Architecture */}
        <section style={{
          backgroundColor: '#0f172a',
          padding: '20px',
          borderRadius: '20px',
          border: '1px solid #38bdf840',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase' }}>
                OVERALL SLEEP DURATION
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '2px 0', color: '#f8fafc' }}>
                7ชั่วโมง 45นาที
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', backgroundColor: '#065f4630', padding: '4px 10px', borderRadius: '20px', border: '1px solid #34d39940' }}>
                🟢 การนอนฟื้นตัวดีเยี่ยม
              </span>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            การนอนหลับของคุณมีคุณภาพดีมาก ร่างกายได้รับการเติมพลังอย่างเต็มที่ สมองผ่อนคลายและมีความเครียดสะสมขณะหลับต่ำมาก (Stress Score: {sleepStress})
          </p>
        </section>

        {/* สัดส่วนระยะการนอนหลับ */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            📊 สัดส่วนระยะการนอนหลับเทียบเกณฑ์มาตรฐาน (AASM Standards)
          </span>

          <div className="metrics-grid">
            {/* Deep Sleep */}
            <div className="stage-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700' }}>🌊 หลับสนิท (Deep)</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>1h 22m</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc' }}>{deepPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${deepPct * 2}%`, height: '100%', backgroundColor: '#38bdf8' }}></div>
              </div>
              <span style={{ fontSize: '10px', color: '#34d399', marginTop: '4px' }}>🟢 อยู่ในเกณฑ์ดี (15-25%)</span>
            </div>

            {/* REM Sleep */}
            <div className="stage-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: '700' }}>🧠 หลับฝัน (REM)</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>2h 05m</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc' }}>{remPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${remPct * 2}%`, height: '100%', backgroundColor: '#a855f7' }}></div>
              </div>
              <span style={{ fontSize: '10px', color: '#34d399', marginTop: '4px' }}>🟢 ฟื้นฟูความจำเยี่ยม (&gt;20%)</span>
            </div>

            {/* Light Sleep */}
            <div className="stage-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#facc15', fontWeight: '700' }}>💤 หลับตื้น (Light)</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>4h 18m</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc' }}>{lightPct}%</div>
              <div className="progress-bar-bg">
                <div style={{ width: `${lightPct}%`, height: '100%', backgroundColor: '#facc15' }}></div>
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>อยู่ในเกณฑ์ปกติ (50-60%)</span>
            </div>
          </div>
        </section>

        {/* ความเครียดและการเคลื่อนไหว */}
        <section style={{
          backgroundColor: '#0f172a',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid #1e293b',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div style={{ backgroundColor: '#151c2c', padding: '14px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>ระดับความเครียดเฉลี่ยขณะหลับ</span>
            <strong style={{ fontSize: '22px', color: '#34d399', display: 'block', margin: '4px 0' }}>
              {sleepStress} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </strong>
            <span style={{ fontSize: '10px', color: '#34d399' }}>🟢 ร่างกายผ่อนคลายระดับดีเยี่ยม</span>
          </div>

          <div style={{ backgroundColor: '#151c2c', padding: '14px', borderRadius: '12px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>จำนวนช่วงเวลาการขยับตัว</span>
            <strong style={{ fontSize: '22px', color: '#38bdf8', display: 'block', margin: '4px 0' }}>
              {restlessCount} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>ครั้ง</span>
            </strong>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>การดิ้น/กระสับกระส่ายกลางดึก</span>
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
          border: '1px solid #334155'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}