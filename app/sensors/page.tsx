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

      const todayLogs = Object.values(rawLogs).filter((log: any) => {
        let t = Number(log.timestamp) || 0;
        if (t < 1000000000000) t = t * 1000;
        const d = new Date(t).toISOString().split('T')[0];
        return d === todayStr;
      });

      const total = todayLogs.length;

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

  const sensors = [
    { title: 'ก๊าซ CO2', value: dailyAvgs?.co2, unit: 'ppm', icon: '🫁', color: '#38bdf8', normal: 'ต่ำกว่า 1000 ppm' },
    { title: 'อุณหภูมิห้อง', value: dailyAvgs?.temp, unit: '°C', icon: '🌡️', color: '#f43f5e', normal: '23.0 - 25.0 °C' },
    { title: 'ความชื้นสัมพัทธ์', value: dailyAvgs?.hum, unit: '%', icon: '💧', color: '#a855f7', normal: '50 - 60 %' },
    { title: 'ฝุ่น PM2.5', value: dailyAvgs?.pm25, unit: 'µg/m³', icon: '🌫️', color: '#eab308', normal: 'ต่ำกว่า 37.5 µg/m³' },
    { title: 'เสียงรบกวน', value: dailyAvgs?.sound, unit: 'dB', icon: '🔊', color: '#34d399', normal: 'ต่ำกว่า 40 dB' },
    { title: 'แสงสว่าง', value: dailyAvgs?.light, unit: 'Lux', icon: '💡', color: '#f97316', normal: '0 Lux (มืดสนิท)' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px 16px 48px 16px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #38bdf8;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 9999px;
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.25);
          width: fit-content;
        }

        .grid-sensors {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 16px;
        }

        .sensor-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        @media (min-width: 640px) {
          .grid-sensors {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .grid-sensors {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <main className="container">
        <Link href="/" className="btn-back">
          ← ย้อนกลับหน้าหลัก
        </Link>

        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 6px 0', color: '#f8fafc' }}>
            🛏️ คุณภาพห้องนอนคืนนี้ (Daily Average Sensors)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            ค่าเฉลี่ยตรวจวัดจริงจากเซ็นเซอร์ ESP32 ตลอดทั้งคืน
          </p>
        </div>

        <div className="grid-sensors">
          {sensors.map((s, idx) => (
            <div key={idx} className="sensor-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>{s.title}</span>
                <span style={{ fontSize: '24px' }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: s.color, margin: '4px 0' }}>
                {s.value ? `${s.value} ` : '-- '}
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{s.unit}</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                เกณฑ์มาตรฐาน: {s.normal}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}