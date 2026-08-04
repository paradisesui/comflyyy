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
  const [historyLogs, setHistoryLogs] = useState<SensorData[]>([]);

  useEffect(() => {
    try {
      const logsRef = ref(database, 'logs');
      const latestLogQuery = query(logsRef, limitToLast(15));
      const unsubscribe = onValue(latestLogQuery, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const items: SensorData[] = Object.keys(data).map((key) => data[key]);
          setHistoryLogs(items);
          setSensor(items[items.length - 1]);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, []);

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

  // คำนวณเส้น SVG Path กราฟอุณหภูมิย้อนหลัง
  const generateSvgPoints = (key: 'temperature' | 'humidity', width: number, height: number) => {
    if (historyLogs.length < 2) return '';
    const values = historyLogs.map((item) => item[key] ?? 0);
    const min = Math.min(...values) - 1;
    const max = Math.max(...values) + 1;
    
    return values.map((val, idx) => {
      const x = (idx / (values.length - 1)) * width;
      const y = height - ((val - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    }).join(' ');
  };

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
      <style jsx>{`
        .sensors-container {
          width: 100%;
          max-width: 1200px;
          background-color: #0f172a;
          border-radius: 32px;
          border: 1px solid #1e293b;
          padding: 28px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <main className="sensors-container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
            รายละเอียดเซนเซอร์สด & แนวโน้ม
          </h1>
          <div style={{ width: '40px' }}></div>
        </div>

        {/* Realtime Sensors Cards */}
        <div className="cards-grid">
          {sensors.map((s, i) => (
            <div key={i} style={{
              backgroundColor: '#162032',
              padding: '16px',
              borderRadius: '20px',
              border: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '24px' }}>{s.icon}</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: s.color,
                  backgroundColor: `${s.color}20`,
                  padding: '3px 10px',
                  borderRadius: '12px'
                }}>{s.status}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>{s.name}</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Realtime Trend Charts */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#38bdf8', margin: 0 }}>
            📈 กราฟแนวโน้มย้อนหลังสด (Firebase Realtime Trend)
          </h2>

          <div className="charts-grid">
            {/* Chart 1: Temperature */}
            <div style={{
              backgroundColor: '#162032',
              padding: '20px',
              borderRadius: '20px',
              border: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>🌡️ แนวโน้มอุณหภูมิ (°C)</span>
                <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>
                  {sensor?.temperature?.toFixed(1)}°C
                </span>
              </div>
              <svg width="100%" height="100" viewBox="0 0 300 100" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  points={generateSvgPoints('temperature', 300, 100)}
                />
              </svg>
            </div>

            {/* Chart 2: Humidity */}
            <div style={{
              backgroundColor: '#162032',
              padding: '20px',
              borderRadius: '20px',
              border: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9' }}>💧 แนวโน้มความชื้น (%)</span>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700' }}>
                  {sensor?.humidity?.toFixed(0)}%
                </span>
              </div>
              <svg width="100%" height="100" viewBox="0 0 300 100" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  points={generateSvgPoints('humidity', 300, 100)}
                />
              </svg>
            </div>
          </div>
        </section>

        <Link href="/" style={{
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          padding: '14px',
          borderRadius: '16px',
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