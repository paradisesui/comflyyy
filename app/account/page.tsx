'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AccountPage() {
  // จำลองข้อมูลผู้ใช้เฉพาะบุคคล (สามารถเชื่อมต่อกับ Firebase Auth ได้)
  const [user, setUser] = useState({
    name: 'Somchai SleepWell',
    email: 'somchai.s@comflyy.app',
    role: 'Premium Sleep Member',
    deviceId: 'ESP32-NODE-BEDROOM-01',
    avgSleepScore: 88,
    trackedNights: 42
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <style jsx>{`
        .account-card {
          width: 100%;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .stats-user-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 640px) {
          .stats-user-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
        }
      `}</style>

      <main className="account-card">
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{
            color: '#38bdf8',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ← กลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>PERSONALIZED PROFILE</span>
        </div>

        {/* User Card */}
        <div style={{
          backgroundColor: '#151c2c',
          borderRadius: '22px',
          padding: '24px',
          border: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 6px 18px rgba(99, 102, 241, 0.4)',
              flexShrink: 0
            }}>
              👤
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
                  {user.name}
                </h1>
                <span style={{ fontSize: '10px', backgroundColor: '#10b98120', color: '#34d399', padding: '2px 8px', borderRadius: '8px', fontWeight: '700' }}>
                  Verified
                </span>
              </div>
              <span style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                {user.email}
              </span>
              <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                ✦ {user.role}
              </span>
            </div>
          </div>

          <button style={{
            padding: '8px 14px',
            borderRadius: '12px',
            backgroundColor: '#0f172a',
            color: '#cbd5e1',
            border: '1px solid #334155',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            แก้ไขโปรไฟล์
          </button>
        </div>

        {/* User Sleep Stats Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            📊 สถิติการใช้งานส่วนบุคคล
          </span>

          <div className="stats-user-grid">
            <div style={{ backgroundColor: '#151c2c', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>คะแนนห้องนอนเฉลี่ยของคุณ</span>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', margin: '6px 0' }}>
                {user.avgSleepScore}%
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>สภาวะห้องนอนโดยรวมอยู่ในเกณฑ์ดี</span>
            </div>

            <div style={{ backgroundColor: '#151c2c', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>คืนที่ได้รับการบันทึกข้อมูล</span>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', margin: '6px 0' }}>
                {user.trackedNights} <span style={{ fontSize: '14px', fontWeight: '400' }}>คืน</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>สะสมข้อมูลเซนเซอร์ต่อเนื่อง</span>
            </div>
          </div>
        </div>

        {/* Devices & Settings Section */}
        <div style={{
          backgroundColor: '#151c2c',
          borderRadius: '22px',
          padding: '20px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            ⚙️ การเชื่อมต่ออุปกรณ์และสิทธิ์เข้าถึง
          </span>

          <div style={{ backgroundColor: '#0f172a', padding: '14px 16px', borderRadius: '14px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700', display: 'block' }}>บอร์ดควบคุมเซนเซอร์</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>ID: {user.deviceId}</span>
            </div>
            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>🟢 เชื่อมต่ออยู่</span>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '14px 16px', borderRadius: '14px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700', display: 'block' }}>การแชร์ข้อมูลให้ Gemini AI</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>ใช้สำหรับประมวลผลคำแนะนำส่วนบุคคล</span>
            </div>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>อนุญาตแล้ว</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button style={{
            backgroundColor: '#ef444415',
            color: '#ef4444',
            padding: '14px',
            borderRadius: '16px',
            border: '1px solid #ef444430',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'center'
          }}>
            🚪 ออกจากระบบ (Sign Out)
          </button>

          <Link href="/" style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            padding: '14px',
            borderRadius: '16px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '13px',
            textDecoration: 'none',
            border: '1px solid #334155'
          }}>
            กลับหน้าหลัก
          </Link>
        </div>
      </main>
    </div>
  );
}