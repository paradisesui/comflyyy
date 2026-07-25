'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, query, limitToLast, onValue } from 'firebase/database';

interface SensorData {
  co2: number;
  humidity: number;
  temperature: number;
}

export default function Home() {
  const [sensor, setSensor] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // ข้อมูลสมมติชั่วโมงการนอน (หรือดึงจาก Database)
  const sleepHours = "7 ชม. 45 นาที"; 

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
        setLoading(false);
      }, () => setLoading(false));
      return () => unsubscribe();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  const calculateScore = (data: SensorData | null) => {
    if (!data) return 97;
    let score = 100;
    if (data.temperature > 25) score -= (data.temperature - 25) * 2;
    if (data.co2 > 800) score -= 10;
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const score = calculateScore(sensor);
  const strokeDashoffset = 440 - (440 * score) / 100;

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
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Top Bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: loading ? '#f59e0b' : '#10b981',
              boxShadow: loading ? '0 0 10px #f59e0b' : '0 0 10px #10b981'
            }}></span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
              {loading ? 'กำลังเชื่อมต่อ...' : 'Live Realtime'}
            </span>
          </div>
          {/* ลิงก์ไปยังหน้า Account */}
          <Link href="/account" style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            fontSize: '18px',
            border: '1px solid #334155'
          }}>
            👤
          </Link>
        </header>

        {/* Circular Gauge Score */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg transform="rotate(-90)" width="200" height="200" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="12" fill="transparent" />
              <circle
                cx="80" cy="80" r="70"
                stroke="#10b981"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1', color: '#fff' }}>{score}%</span>
              <span style={{ fontSize: '10px', color: '#64748b', letterSpacing: '2px', marginTop: '4px', fontWeight: '600' }}>ROOM SCORE</span>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>ระดับคุณภาพห้องนอน</span>
            <h2 style={{ fontSize: '24px', color: '#34d399', fontWeight: '700', margin: '2px 0 0 0' }}>ดีเยี่ยม</h2>
          </div>
        </section>

        {/* 🛏️ เพิ่มแถบแสดงชั่วโมงการนอน */}
        <div style={{
          backgroundColor: '#162032',
          padding: '12px 16px',
          borderRadius: '16px',
          border: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🌙</span>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>ระยะเวลาการนอนคืนนี้</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>{sleepHours}</span>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: '#10b981', backgroundColor: '#10b98115', padding: '4px 8px', borderRadius: '8px', border: '1px solid #10b98130' }}>
            เพียงพอ
          </span>
        </div>

        {/* Realtime Sensors Pill Grid */}
        {sensor && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
            backgroundColor: '#162032',
            padding: '12px',
            borderRadius: '16px',
            border: '1px solid #1e293b'
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>อุณหภูมิ</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>{sensor.temperature?.toFixed(1)}°C</span>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid #1e293b', borderRight: '1px solid #1e293b' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>ความชื้น</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>{sensor.humidity?.toFixed(0)}%</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>CO2</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>{sensor.co2} ppm</span>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <footer style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
          <Link href="/sensors" style={{
            backgroundColor: '#10b981',
            color: '#022c22',
            padding: '12px',
            borderRadius: '14px',
            textAlign: 'center',
            fontWeight: '700',
            fontSize: '14px',
            textDecoration: 'none'
          }}>
            ดูคะแนนเพิ่มเติม ➔
          </Link>
          <Link href="/persona" style={{
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
            ประวัติการใช้งาน
          </Link>
        </footer>
      </main>
    </div>
  );
}