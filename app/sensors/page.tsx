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

export default function SensorsPage() {
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
    } catch (e) {
      console.error(e);
    }
  }, []);

  const sensors = [
    { name: 'อุณหภูมิ (SHT31)', value: sensor ? `${sensor.temperature?.toFixed(1)}°C` : '--', status: sensor && sensor.temperature > 26 ? 'เฝ้าระวัง' : 'ปกติ', color: sensor && sensor.temperature > 26 ? '#f59e0b' : '#10b981', icon: '🌡️' },
    { name: 'ความชื้น (SHT31)', value: sensor ? `${sensor.humidity?.toFixed(0)}%` : '--', status: 'ปกติ', color: '#10b981', icon: '💧' },
    { name: 'แสงสว่าง (BH1750)', value: sensor ? `${sensor.lux?.toFixed(1)} Lux` : '--', status: sensor && sensor.lux > 50 ? 'สว่างไป' : 'เหมาะกับการนอน', color: sensor && sensor.lux > 50 ? '#f59e0b' : '#10b981', icon: '💡' },
    { name: 'CO2 (MH-Z19B)', value: sensor ? `${sensor.co2} ppm` : '--', status: sensor && sensor.co2 > 800 ? 'ปานกลาง' : 'ดีมาก', color: sensor && sensor.co2 > 800 ? '#f59e0b' : '#10b981', icon: '🍃' },
    { name: 'เสียงรบกวน (KY-038)', value: sensor ? `${sensor.sound}` : '--', status: sensor && sensor.sound > 1500 ? 'มีเสียงรบกวน' : 'เงียบสงบ', color: sensor && sensor.sound > 1500 ? '#ef4444' : '#10b981', icon: '🔊' },
    { name: 'PM2.5 (PMS5003)', value: sensor ? `${sensor.pm2_5} µg/m³` : '--', status: 'ดีมาก', color: '#10b981', icon: '🌫️' },
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            ← ย้อนกลับ
          </Link>
          <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
            รายละเอียดเซนเซอร์สด
          </h1>
          <div style={{ width: '40px' }}></div>
        </div>

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