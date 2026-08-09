'use client';

import React from 'react';
import Link from 'next/link';

export default function AccountPage() {
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
        .account-container {
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

        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .avatar-box {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          background-color: rgba(15, 23, 42, 0.6);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 13px;
        }
      `}</style>

      <main className="account-container">
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-back">
            ← ย้อนกลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>
            USER ACCOUNT PROFILE
          </span>
        </div>

        {/* Profile Card */}
        <section className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(14, 116, 144, 0.18) 100%)',
          borderColor: 'rgba(56, 189, 248, 0.35)'
        }}>
          <div className="profile-header">
            <div className="avatar-box">👤</div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
                Comfy Sleep User
              </h1>
              <p style={{ fontSize: '12px', color: '#38bdf8', margin: 0, fontWeight: '600' }}>
                🟢 Status: Garmin Connected & Active
              </p>
            </div>
          </div>
        </section>

        {/* Settings & Info Card */}
        <section className="glass-card">
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            ⚙️ การตั้งค่าระบบและการเชื่อมต่อ (System Settings)
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="info-row">
              <span style={{ color: '#94a3b8' }}>อุปกรณ์นาฬิกาหลัก</span>
              <strong style={{ color: '#f8fafc' }}>Garmin Connect API</strong>
            </div>

            <div className="info-row">
              <span style={{ color: '#94a3b8' }}>ฐานข้อมูลหลัก</span>
              <strong style={{ color: '#34d399' }}>Firebase Realtime Database</strong>
            </div>

            <div className="info-row">
              <span style={{ color: '#94a3b8' }}>ตัวประมวลผล AI</span>
              <strong style={{ color: '#38bdf8' }}>Google Gemini AI Engine</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}