'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function SensorsPage() {
  const [dailyAvgs, setDailyAvgs] = useState<any>(null);

  useEffect(() => {
    if (!database) return;

    const logsRef = ref(database, 'logs');
    const unsubscribe = onValue(logsRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const rawLogs = snapshot.val();
      const todayStr = new Date().toISOString().split('T')[0];

      // คำนวณกรองจาก Log วันปัจจุบันจริงๆ
      const todayLogs = Object.values(rawLogs).filter((log: any) => {
        let t = Number(log.timestamp) || 0;
        if (t < 1000000000000) t = t * 1000;
        const d = new Date(t).toISOString().split('T')[0];
        return d === todayStr;
      });

      const total = todayLogs.length;

      // ป้องกันการหารด้วย 0 ถ้ายังไม่มี Log ของวันนี้
      if (total === 0) {
        setDailyAvgs(null);
        return;
      }

      setDailyAvgs({
        temp: (todayLogs.reduce((s: number, i: any) => s + Number(i.temperature || 0), 0) / total).toFixed(1),
        hum: (todayLogs.reduce((s: number, i: any) => s + Number(i.humidity || 0), 0) / total).toFixed(1),
        co2: (todayLogs.reduce((s: number, i: any) => s + Number(i.co2 || 0), 0) / total).toFixed(0),
        pm25: (todayLogs.reduce((s: number, i: any) => s + Number(i.pm25 || 0), 0) / total).toFixed(1),
        sound: (todayLogs.reduce((s: number, i: any) => s + Number(i.sound || 0), 0) / total).toFixed(0),
        light: (todayLogs.reduce((s: number, i: any) => s + Number(i.light_lux || 0), 0) / total).toFixed(0)
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#030712', color: '#f8fafc', padding: '16px 12px' }}>
      <main style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px' }}>
          ← ย้อนกลับหน้าหลัก
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0' }}>
          🛏️ คุณภาพห้องนอนคืนนี้ (Daily Average Sensors)
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ background: 'rgba(15,23,42,0.6)', padding: '14px', borderRadius: '12px' }}>
            🫁 CO2: <strong>{dailyAvgs?.co2 ? `${dailyAvgs.co2} ppm` : '--'}</strong>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.6)', padding: '14px', borderRadius: '12px' }}>
            🌡️ อุณหภูมิ: <strong>{dailyAvgs?.temp ? `${dailyAvgs.temp} °C` : '--'}</strong>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.6)', padding: '14px', borderRadius: '12px' }}>
            💧 ความชื้น: <strong>{dailyAvgs?.hum ? `${dailyAvgs.hum} %` : '--'}</strong>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.6)', padding: '14px', borderRadius: '12px' }}>
            🌫️ PM2.5: <strong>{dailyAvgs?.pm25 ? `${dailyAvgs.pm25} µg/m³` : '--'}</strong>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.6)', padding: '14px', borderRadius: '12px' }}>
            🔊 เสียง: <strong>{dailyAvgs?.sound ? `${dailyAvgs.sound} dB` : '--'}</strong>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.6)', padding: '14px', borderRadius: '12px' }}>
            💡 แสง: <strong>{dailyAvgs?.light ? `${dailyAvgs.light} Lux` : '--'}</strong>
          </div>
        </div>
      </main>
    </div>
  );
}