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

  // ฟังก์ชันช่วยประเมินสถานะตามเกณฑ์งานวิจัย
  const getTempInfo = (t?: number) => {
    if (t === undefined) return { status: 'N/A', color: '#64748b' };
    if (t <= 25) return { status: 'ปกติ', color: '#10b981' };
    return { status: 'เฝ้าระวัง', color: '#f59e0b' };
  };

  const getHumInfo = (h?: number) => {
    if (h === undefined) return { status: 'N/A', color: '#64748b' };
    if (h >= 40 && h <= 60) return { status: 'ปกติ', color: '#10b981' };
    if (h > 60) return { status: 'ชื้นเกินไป', color: '#f59e0b' };
    return { status: 'แห้งเกินไป', color: '#f59e0b' };
  };

  const getLuxInfo = (l?: number) => {
    if (l === undefined) return { status: 'N/A', color: '#64748b' };
    if (l < 5) return { status: 'มืดสนิท (ดี)', color: '#10b981' };
    if (l <= 10) return { status: 'พอใช้', color: '#f59e0b' };
    return { status: 'สว่างไป', color: '#ef4444' };
  };

  const getCo2Info = (c?: number) => {
    if (c === undefined) return { status: 'N/A', color: '#64748b' };
    if (c < 800) return { status: 'ดีมาก', color: '#10b981' };
    return { status: 'ควรระบายอากาศ', color: '#f59e0b' };
  };

  const getSoundInfo = (s?: number) => {
    if (s === undefined) return { status: 'N/A', color: '#64748b' };
    if (s > 1000) return { status: 'มีเสียงรบกวน', color: '#ef4444' };
    return { status: 'เงียบสงบ', color: '#10b981' };
  };

  const getPmInfo = (p?: number) => {
    if (p === undefined) return { status: 'N/A', color: '#64748b' };
    if (p <= 15) return { status: 'ดีมาก', color: '#10b981' };
    return { status: 'มีฝุ่นสะสม', color: '#f59e0b' };
  };

  const temp = getTempInfo(sensor?.temperature);
  const hum = getHumInfo(sensor?.humidity);
  const lux = getLuxInfo(sensor?.lux);
  const co2 = getCo2Info(sensor?.co2);
  const sound = getSoundInfo(sensor?.sound);
  const pm = getPmInfo(sensor?.pm2_5);

  const sensors = [
    { name: 'อุณหภูมิ (SHT31)', value: sensor ? `${sensor.temperature?.toFixed(1)}°C` : '--', status: temp.status, color: temp.color, icon: '🌡️' },
    { name: 'ความชื้น (SHT31)', value: sensor ? `${sensor.humidity?.toFixed(0)}%` : '--', status: hum.status, color: hum.color, icon: '💧' },
    { name: 'แสงสว่าง (BH1750)', value: sensor ? `${sensor.lux?.toFixed(1)} Lux` : '--', status: lux.status, color: lux.color, icon: '💡' },
    { name: 'CO2 (MH-Z19B)', value: sensor ? `${sensor.co2} ppm` : '--', status: co2.status, color: co2.color, icon: '🍃' },
    { name: 'เสียงรบกวน (KY-038)', value: sensor ? `${sensor.sound}` : '--', status: sound.status, color: sound.color, icon: '🔊' },
    { name: 'PM2.5 (PMS5003)', value: sensor ? `${sensor.pm2_5} µg/m³` : '--', status: pm.status, color: pm.color, icon: '🌫️' },
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