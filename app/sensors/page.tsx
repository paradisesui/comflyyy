'use client';

import React from 'react';
import Link from 'next/link';

export default function SensorsPage() {
  const sensors = [
    { name: 'อุณหภูมิ (SHT31)', value: '27.9°C', status: 'เฝ้าระวัง', color: '#f59e0b', icon: '🌡️' },
    { name: 'ความชื้น (SHT31)', value: '57.5%', status: 'ปกติ', color: '#10b981', icon: '💧' },
    { name: 'แสงสว่าง (BH1750)', value: '68.7 Lux', status: 'สว่างไป', color: '#f59e0b', icon: '💡' },
    { name: 'CO2 (MH-Z19B)', value: '992 ppm', status: 'ปานกลาง', color: '#f59e0b', icon: '🍃' },
    { name: 'เสียงรบกวน (KY-038)', value: '1650 dB', status: 'เงียบสงบ', color: '#10b981', icon: '🔊' },
    { name: 'PM2.5 (PMS5003)', value: '1 µg/m³', status: 'ดีมาก', color: '#10b981', icon: '🌫️' },
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
            รายละเอียดเซนเซอร์
          </h1>
          <div style={{ width: '40px' }}></div>
        </div>

        {/* 2-Column Sensor Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {sensors.map((s, i) => (
            <div key={i} style={{
              backgroundColor: '#162032',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: s.color,
                  backgroundColor: `${s.color}20`,
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>{s.status}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{s.name}</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Card */}
        <div style={{
          backgroundColor: '#162032',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid #1e293b'
        }}>
          <h3 style={{ fontSize: '13px', color: '#f1f5f9', margin: '0 0 10px 0' }}>📊 กราฟพฤติกรรมสิ่งแวดล้อมคืนนี้</h3>
          <div style={{
            height: '100px',
            backgroundColor: '#090d16',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
            fontSize: '12px'
          }}>
            [ Sensor Live Chart ]
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