'use client';

import React from 'react';
import Link from 'next/link';

export default function PersonaPage() {
  const weights = [
    { name: 'เสียงรบกวน (Sound)', weight: 35, color: '#ef4444' },
    { name: 'อุณหภูมิ (Temp)', weight: 25, color: '#f59e0b' },
    { name: 'CO2', weight: 20, color: '#10b981' },
    { name: 'ฝุ่น PM2.5', weight: 10, color: '#06b6d4' },
    { name: 'ความชื้น (Humidity)', weight: 5, color: '#6366f1' },
    { name: 'แสง (Lux)', weight: 5, color: '#a855f7' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <main style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#0f172a',
        borderRadius: '28px',
        border: '1px solid #1e293b',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            ← ย้อนกลับ
          </Link>
          <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
            ประวัติ & AI Persona
          </h1>
          <div style={{ width: '40px' }}></div>
        </div>

        {/* Persona Card */}
        <div style={{
          backgroundColor: '#162032',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid #10b98150'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#34d399', margin: 0 }}>Sleep Persona Analysis</h2>
              <span style={{ fontSize: '11px', color: '#64748b' }}>สะสมข้อมูล 12 คืน</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
            คุณเป็นกลุ่ม <strong style={{ color: '#34d399' }}>"ไวต่อเสียงรบกวน"</strong> เสียงที่เกิน 45 dB ในช่วงหลับลึกจะทำให้คุณตื่นทันที
          </p>
        </div>

        {/* Weight Bars */}
        <div style={{
          backgroundColor: '#162032',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid #1e293b'
        }}>
          <h3 style={{ fontSize: '13px', color: '#f1f5f9', margin: '0 0 12px 0' }}>⚖️ ค่าน้ำหนักตัวแปรเฉพาะบุคคล</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {weights.map((w, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>{w.name}</span>
                  <span style={{ fontWeight: '700', color: '#fff' }}>{w.weight}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#090d16', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${w.weight}%`, height: '100%', backgroundColor: w.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <Link href="/" style={{
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          padding: '12px',
          borderRadius: '14px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '14px',
          textDecoration: 'none',
          border: '1px solid #334155'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}