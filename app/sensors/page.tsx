'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function SensorsPage() {
  const [roomData, setRoomData] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!database) return;

    // ดึงข้อมูล room_env ทั้งหมดเพื่อหาวันล่าสุดแบบ Dynamic
    const roomEnvRef = ref(database, 'room_env');
    const unsubscribe = onValue(roomEnvRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const dates = Object.keys(val).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        if (dates.length > 0) {
          const latestDateKey = dates[0];
          setCurrentDate(latestDateKey);
          setRoomData(val[latestDateKey]);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(14, 116, 144, 0.25) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '32px 16px 48px 16px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/" style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            textDecoration: 'none',
            fontSize: '18px'
          }}>
            ←
          </Link>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>🛏️ COMFY ROOM ENVIRONMENT</h1>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {loading ? 'กำลังโหลดข้อมูล...' : `คุณภาพสภาพแวดล้อมห้องนอนประจำวันที่ ${currentDate}`}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '32px' }}>🌡️</span>
            <span style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>อุณหภูมิห้อง</span>
            <strong style={{ fontSize: '32px', color: '#38bdf8', fontWeight: '900' }}>
              {roomData?.temperature != null ? `${roomData.temperature} °C` : '--'}
            </strong>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '32px' }}>💧</span>
            <span style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>ความชื้นสัมพัทธ์</span>
            <strong style={{ fontSize: '32px', color: '#38bdf8', fontWeight: '900' }}>
              {roomData?.humidity != null ? `${roomData.humidity} %` : '--'}
            </strong>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '32px' }}>🫁</span>
            <span style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>ก๊าซคาร์บอนไดออกไซด์ (CO2)</span>
            <strong style={{ fontSize: '32px', color: '#f43f5e', fontWeight: '900' }}>
              {roomData?.co2 != null ? `${roomData.co2} ppm` : '--'}
            </strong>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '32px' }}>🔊</span>
            <span style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>ระดับเสียงเฉลี่ย</span>
            <strong style={{ fontSize: '32px', color: '#38bdf8', fontWeight: '900' }}>
              {roomData?.noise != null ? `${roomData.noise} dB` : '--'}
            </strong>
          </div>
        </div>

      </div>
    </div>
  );
}