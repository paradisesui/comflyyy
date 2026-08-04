'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, query, limitToLast, onValue } from 'firebase/database';

interface SensorData {
  co2: number;
  humidity: number;
  lux: number;
  pm10: number;
  pm1_0: number;
  pm2_5: number;
  sound: number;
  temperature: number;
  timestamp: number;
}

export default function AllSensorsPage() {
  const [sensor, setSensor] = useState<SensorData | null>(null);

  useEffect(() => {
    try {
      const logsRef = ref(database, 'logs');
      const latestLogQuery = query(logsRef, limitToLast(1));
      const unsubscribe = onValue(latestLogQuery, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const latestKey = Object.keys(data)[0];
          setSensor(data[latestKey]);
        }
      });
      return () => unsubscribe();
    } catch (e) {}
  }, []);

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
        maxWidth: '1000px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
            ← กลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b' }}>ESP32 Sensor Array</span>
        </div>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
            📡 รายละเอียดค่าเซนเซอร์ทั้งหมด
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            แสดงผลข้อมูลสภาพแวดล้อมห้องนอนแบบละเอียดทุกพารามิเตอร์
          </p>
        </div>

        {/* Sensor Bento Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
          <div style={{ backgroundColor: '#151c2c', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>🌡️ อุณหภูมิ (Temperature)</span>
            <div style={{ fontSize: '26px', fontWeight: '800', margin: '6px 0', color: '#f8fafc' }}>
              {sensor ? `${sensor.temperature?.toFixed(1)} °C` : '--'}
            </div>
            <span style={{ fontSize: '11px', color: '#34d399' }}>เกณฑ์มาตรฐาน: 22 - 25 °C</span>
          </div>

          <div style={{ backgroundColor: '#151c2c', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>💧 ความชื้น (Humidity)</span>
            <div style={{ fontSize: '26px', fontWeight: '800', margin: '6px 0', color: '#f8fafc' }}>
              {sensor ? `${sensor.humidity?.toFixed(0)} %` : '--'}
            </div>
            <span style={{ fontSize: '11px', color: '#34d399' }}>เกณฑ์มาตรฐาน: 40 - 60 %</span>
          </div>

          <div style={{ backgroundColor: '#151c2c', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>🍃 คาร์บอนไดออกไซด์ (CO2)</span>
            <div style={{ fontSize: '26px', fontWeight: '800', margin: '6px 0', color: '#f8fafc' }}>
              {sensor ? `${sensor.co2} ppm` : '--'}
            </div>
            <span style={{ fontSize: '11px', color: '#38bdf8' }}>เกณฑ์ปลอดภัย: &lt; 800 ppm</span>
          </div>

          <div style={{ backgroundColor: '#151c2c', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>💡 ความสว่างแสง (Lux)</span>
            <div style={{ fontSize: '26px', fontWeight: '800', margin: '6px 0', color: '#f8fafc' }}>
              {sensor ? `${sensor.lux?.toFixed(1)} Lux` : '--'}
            </div>
            <span style={{ fontSize: '11px', color: '#34d399' }}>เกณฑ์หลับสนิท: &lt; 5 Lux</span>
          </div>

          <div style={{ backgroundColor: '#151c2c', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>🌫️ ฝุ่น PM 2.5</span>
            <div style={{ fontSize: '26px', fontWeight: '800', margin: '6px 0', color: '#f8fafc' }}>
              {sensor ? `${sensor.pm2_5} µg/m³` : '--'}
            </div>
            <span style={{ fontSize: '11px', color: '#34d399' }}>เกณฑ์ปลอดภัย: &lt; 15 µg/m³</span>
          </div>

          <div style={{ backgroundColor: '#151c2c', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>🔊 ระดับเสียง (Noise Sound)</span>
            <div style={{ fontSize: '26px', fontWeight: '800', margin: '6px 0', color: '#f8fafc' }}>
              {sensor ? `${sensor.sound}` : '--'}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Analog Signal Baseline</span>
          </div>
        </div>

        <Link href="/" style={{
          backgroundColor: '#151c2c',
          color: '#f8fafc',
          padding: '14px',
          borderRadius: '16px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '13px',
          textDecoration: 'none',
          border: '1px solid #1e293b'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}