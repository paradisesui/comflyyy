'use client';

import React from 'react';
import Link from 'next/link';

export default function SmartWatchPersonaPage() {
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
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>SMART WATCH METRICS</span>
        </div>

        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            ⌚ สถิติการนอนหลับและหัวใจ (Smart Watch Sync)
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            รายงานสัดส่วนระยะการนอนและแนวโน้มอัตราการเต้นของหัวใจจากนาฬิกาอัจฉริยะ
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
                รวม 7h 22m
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div style={{ width: '100%', height: '14px', backgroundColor: '#1e293b', borderRadius: '7px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '25%', height: '100%', backgroundColor: '#6366f1' }} title="Deep Sleep 25%"></div>
              <div style={{ width: '22%', height: '100%', backgroundColor: '#38bdf8' }} title="REM Sleep 22%"></div>
              <div style={{ width: '53%', height: '100%', backgroundColor: '#334155' }} title="Light Sleep 53%"></div>
            </div>

            <div className="sleep-stages-grid">
              <div style={{ backgroundColor: '#151c2c', padding: '12px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#818cf8', display: 'block', fontWeight: '700', marginBottom: '2px' }}>● Deep Sleep</span>
                <strong style={{ fontSize: '16px', color: '#f8fafc', display: 'block' }}>1h 45m</strong>
                <span style={{ fontSize: '10px', color: '#64748b' }}>25% (หลับสนิท)</span>
              </div>

              <div style={{ backgroundColor: '#151c2c', padding: '12px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#38bdf8', display: 'block', fontWeight: '700', marginBottom: '2px' }}>● REM Sleep</span>
                <strong style={{ fontSize: '16px', color: '#f8fafc', display: 'block' }}>1h 32m</strong>
                <span style={{ fontSize: '10px', color: '#64748b' }}>22% (ช่วงฝัน)</span>
              </div>

              <div style={{ backgroundColor: '#151c2c', padding: '12px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '700', marginBottom: '2px' }}>● Light Sleep</span>
                <strong style={{ fontSize: '16px', color: '#f8fafc', display: 'block' }}>3h 45m</strong>
                <span style={{ fontSize: '10px', color: '#64748b' }}>53% (หลับตื้น)</span>
              </div>
            </div>
          </section>

          {/* 2. แนวโน้มอัตราการเต้นหัวใจขณะนอน (Sleep Heart Rate & Recovery Trend) */}
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
              ❤️ แนวโน้มอัตราการเต้นหัวใจขณะนอนหลับ (Heart Rate Trend)
            </span>

            <div className="hr-grid">
              <div style={{ backgroundColor: '#151c2c', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Resting Heart Rate</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#f43f5e', margin: '4px 0' }}>
                  58 <span style={{ fontSize: '12px', fontWeight: '400', color: '#94a3b8' }}>BPM</span>
                </div>
                <span style={{ fontSize: '10px', color: '#34d399' }}>🟢 หัวใจผ่อนคลายดี</span>
              </div>

              <div style={{ backgroundColor: '#151c2c', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Avg Sleep HR</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#38bdf8', margin: '4px 0' }}>
                  62 <span style={{ fontSize: '12px', fontWeight: '400', color: '#94a3b8' }}>BPM</span>
                </div>
                <span style={{ fontSize: '10px', color: '#34d399' }}>อยู่ในเกณฑ์ปกติ</span>
              </div>

              <div style={{ backgroundColor: '#151c2c', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Body Recovery</span>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#34d399', margin: '4px 0' }}>
                  92%
                </div>
                <span style={{ fontSize: '10px', color: '#38bdf8' }}>⚡ ร่างกายฟื้นฟูเต็มที่</span>
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