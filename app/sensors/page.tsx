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
        temp: Number((todayLogs.reduce((s: number, i: any) => s + Number(i.temperature || 0), 0) / total).toFixed(1)),
        hum: Number((todayLogs.reduce((s: number, i: any) => s + Number(i.humidity || 0), 0) / total).toFixed(1)),
        co2: Number((todayLogs.reduce((s: number, i: any) => s + Number(i.co2 || 0), 0) / total).toFixed(0)),
        pm25: Number((todayLogs.reduce((s: number, i: any) => s + Number(i.pm25 || 0), 0) / total).toFixed(1)),
        sound: Number((todayLogs.reduce((s: number, i: any) => s + Number(i.sound || 0), 0) / total).toFixed(0)),
        light: Number((todayLogs.reduce((s: number, i: any) => s + Number(i.light_lux || 0), 0) / total).toFixed(0))
      });
    });

    return () => unsubscribe();
  }, []);

  // ฟังก์ชันคำนวณประเมินเกณฑ์ความปลอดภัยแบบ Dynamic Real-time
  const getSensorStatus = (type: string, val: number | null) => {
    if (val === null || val === undefined) return { label: 'กำลังรอข้อมูล...', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' };

    switch (type) {
      case 'co2':
        if (val <= 800) return { label: '🟢 ดีเยี่ยม (อากาศบริสุทธิ์)', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
        if (val <= 1000) return { label: '🟡 ปกติ (อยู่ในเกณฑ์)', color: '#facc15', bg: 'rgba(250, 204, 21, 0.12)' };
        return { label: '🔴 อันตราย (ควรระบายอากาศ)', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };

      case 'temp':
        if (val >= 23 && val <= 25) return { label: '🟢 เย็นสบายพอดี (เหมาะสม)', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
        if (val < 23) return { label: '🔵 ค่อนข้างเย็นเกินไป', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
        return { label: '🔴 ร้อนเกินไป (เหงื่อออกง่าย)', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };

      case 'hum':
        if (val >= 50 && val <= 60) return { label: '🟢 เหมาะสมสำหรับการนอน', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
        if (val < 50) return { label: '🟡 ค่อนข้างแห้งเกินไป', color: '#facc15', bg: 'rgba(250, 204, 21, 0.12)' };
        return { label: '🔴 ชื้นสูงเกินเกณฑ์ (อึดอัด)', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };

      case 'pm25':
        if (val <= 15) return { label: '🟢 ดีเยี่ยม (ไม่มีฝุ่น)', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
        if (val <= 37.5) return { label: '🟡 ปานกลาง (ยอมรับได้)', color: '#facc15', bg: 'rgba(250, 204, 21, 0.12)' };
        return { label: '🔴 มีฝุ่นรบกวนสูง', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };

      case 'sound':
        if (val <= 40) return { label: '🟢 เงียบสงบ (ไม่มีเสียงรบกวน)', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
        if (val <= 60) return { label: '🟡 มีเสียงรบกวนปานกลาง', color: '#facc15', bg: 'rgba(250, 204, 21, 0.12)' };
        return { label: '🔴 มีเสียงรบกวนดังเกินไป', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };

      case 'light':
        if (val === 0) return { label: '🟢 มืดสนิท (เหมาะแก่การนอน)', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
        return { label: '🔴 มีแสงสว่างแยงตา', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };

      default:
        return { label: 'ปกติ', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
    }
  };

  const sensorCards = [
    { type: 'co2', title: 'ก๊าซ CO2', value: dailyAvgs?.co2, unit: 'ppm', icon: '🫁', color: '#38bdf8', standard: 'ต่ำกว่า 1000 ppm' },
    { type: 'temp', title: 'อุณหภูมิห้อง', value: dailyAvgs?.temp, unit: '°C', icon: '🌡️', color: '#f43f5e', standard: '23.0 - 25.0 °C' },
    { type: 'hum', title: 'ความชื้นสัมพัทธ์', value: dailyAvgs?.hum, unit: '%', icon: '💧', color: '#a855f7', standard: '50 - 60 %' },
    { type: 'pm25', title: 'ฝุ่น PM2.5', value: dailyAvgs?.pm25, unit: 'µg/m³', icon: '🌫️', color: '#eab308', standard: 'ต่ำกว่า 37.5 µg/m³' },
    { type: 'sound', title: 'เสียงรบกวน', value: dailyAvgs?.sound, unit: 'dB', icon: '🔊', color: '#34d399', standard: 'ต่ำกว่า 40 dB' },
    { type: 'light', title: 'แสงสว่าง', value: dailyAvgs?.light, unit: 'Lux', icon: '💡', color: '#f97316', standard: '0 Lux (มืดสนิท)' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '48px 16px 48px 16px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ปุ่มกลับหน้าหลักสไตล์ Glassmorphic Glow ปุ่มโดดเด่น */
        .btn-pill-back {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #ffffff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          padding: 10px 24px;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.6) 0%, rgba(37, 99, 235, 0.8) 100%);
          border: 1.5px solid rgba(56, 189, 248, 0.7);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.35), 0 8px 20px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          width: fit-content;
        }

        .btn-pill-back:hover {
          transform: translateY(-2px) scale(1.03);
          border-color: #38bdf8;
          box-shadow: 0 0 30px rgba(56, 189, 248, 0.6), 0 12px 28px rgba(0, 0, 0, 0.5);
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.8) 0%, rgba(37, 99, 235, 0.95) 100%);
        }

        .arrow-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .grid-sensors {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 18px;
        }

        .sensor-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
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
        {/* Navigation Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-pill-back">
            <span className="arrow-circle">←</span>
            <span>กลับหน้าหลัก</span>
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', letterSpacing: '0.8px' }}>
            DAILY AVERAGE SENSOR METRICS
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#f8fafc' }}>
            🛏️ คุณภาพห้องนอนคืนนี้ (Daily Average Sensors)
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            ค่าเฉลี่ยตรวจวัดจริงจากเซ็นเซอร์ ESP32 พร้อมการประเมินสภาวะตามเกณฑ์มาตรฐาน
          </p>
        </div>

        {/* Sensor Cards Grid */}
        <div className="grid-sensors">
          {sensorCards.map((s, idx) => {
            const status = getSensorStatus(s.type, s.value);

            return (
              <div key={idx} className="sensor-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '700' }}>{s.title}</span>
                  <span style={{ fontSize: '24px' }}>{s.icon}</span>
                </div>

                <div style={{ fontSize: '36px', fontWeight: '900', color: s.color, lineHeight: 1, margin: '4px 0' }}>
                  {s.value !== null && s.value !== undefined ? `${s.value} ` : '-- '}
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>{s.unit}</span>
                </div>

                {/* Badge บอกระดับเกณฑ์ของค่าเซ็นเซอร์ */}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: status.bg,
                  color: status.color,
                  fontSize: '11px',
                  fontWeight: '700',
                  border: `1px solid ${status.color}30`
                }}>
                  {status.label}
                </div>

                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  เกณฑ์มาตรฐาน: {s.standard}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}