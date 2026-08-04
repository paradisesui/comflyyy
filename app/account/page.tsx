'use client';

import React from 'react';
import Link from 'next/link';

export default function AccountPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '20px 12px'
    }}>
      <main style={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: '#151c2c',
        borderRadius: '24px',
        border: '1px solid #1e293b',
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
            ← กลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b' }}>User Profile</span>
        </div>

        {/* Profile Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#0f172a', padding: '16px', borderRadius: '18px', border: '1px solid #1e293b' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            👤
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 2px 0', color: '#f8fafc' }}>
              COMFLYY User
            </h2>
            <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '600' }}>
              • Premium Account Connected
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>⚙️ บัญชีและการเชื่อมต่อ</span>

          <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>อุปกรณ์เซนเซอร์หลัก</span>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700' }}>ESP32 Bedroom Node</span>
          </div>

          <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>ระบบวิเคราะห์ AI</span>
            <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: '700' }}>Gemini 1.5 Flash</span>
          </div>
        </div>

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