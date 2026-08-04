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
  const [loading, setLoading] = useState(true);

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

  // ฟังก์ชันประเมินสถานะและคืนค่าสี/ข้อความ
  const getTempStatus = (val: number | undefined) => {
    if (val === undefined) return { label: 'กำลังโหลด...', color: '#64748b', bg: '#1e293b' };
    if (val >= 22 && val <= 25) return { label: '🟢 เหมาะสมกับการนอน', color: '#34d399', bg: '#10b98120' };
    if (val > 25 && val <= 28) return { label: '🟡 ค่อนข้างอุ่น', color: '#f59e0b', bg: '#f59e0b20' };
    if (val < 22) return { label: '🟡 ค่อนข้างเย็น', color: '#38bdf8', bg: '#38bdf820' };
    return { label: '🔴 อุณหภูมิสูงเกินไป', color: '#ef4444', bg: '#ef444420' };
  };

  const getHumidityStatus = (val: number | undefined) => {
    if (val === undefined) return { label: 'กำลังโหลด...', color: '#64748b', bg: '#1e293b' };
    if (val >= 40 && val <= 60) return { label: '🟢 ความชื้นพอดี', color: '#34d399', bg: '#10b98120' };
    if (val > 60) return { label: '🟡 ชื้นเกินไป (เสี่ยงเชื้อรา)', color: '#f59e0b', bg: '#f59e0b20' };
    return { label: '🟡 อากาศแห้งเกินไป', color: '#f59e0b', bg: '#f59e0b20' };
  };

  const getCo2Status = (val: number | undefined) => {
    if (val === undefined) return { label: 'กำลังโหลด...', color: '#64748b', bg: '#1e293b' };
    if (val < 800) return { label: '🟢 อากาศบริสุทธิ์', color: '#34d399', bg: '#10b98120' };
    if (val >= 800 && val <= 1000) return { label: '🟡 สะสมปานกลาง', color: '#f59e0b', bg: '#f59e0b20' };
    return { label: '🔴 ควรเปิดระบายอากาศ', color: '#ef4444', bg: '#ef444420' };
  };

  const getLuxStatus = (val: number | undefined) => {
    if (val === undefined) return { label: 'กำลังโหลด...', color: '#64748b', bg: '#1e293b' };
    if (val <= 5) return { label: '🟢 มืดสนิท (ดีเยี่ยม)', color: '#34d399', bg: '#10b98120' };
    if (val > 5 && val <= 30) return { label: '🟡 มีแสงสลัวรบกวน', color: '#f59e0b', bg: '#f59e0b20' };
    return { label: '🔴 สว่างเกินไปสำหรับการนอน', color: '#ef4444', bg: '#ef444420' };
  };

  const getPm25Status = (val: number | undefined) => {
    if (val === undefined) return { label: 'กำลังโหลด...', color: '#64748b', bg: '#1e293b' };
    if (val <= 15) return { label: '🟢 อากาศสะอาดมาก', color: '#34d399', bg: '#10b98120' };
    if (val > 15 && val <= 37.5) return { label: '🟡 ฝุ่นปานกลาง', color: '#f59e0b', bg: '#f59e0b20' };
    return { label: '🔴 ฝุ่นเกินเกณฑ์มาตรฐาน', color: '#ef4444', bg: '#ef444420' };
  };

  const tempSt = getTempStatus(sensor?.temperature);
  const humSt = getHumidityStatus(sensor?.humidity);
  const co2St = getCo2Status(sensor?.co2);
  const luxSt = getLuxStatus(sensor?.lux);
  const pmSt = getPm25Status(sensor?.pm2_5);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <style jsx>{`
        .sensor-container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .sensor-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 768px) {
          .sensor-grid {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
        }
      `}</style>

      <main className="sensor-container">
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{
            color: '#38bdf8',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ← กลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            {loading ? 'Connecting...' : 'Live Sensor Data'}
          </span>
        </div>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', color: '#f8fafc' }}>
            📡 รายละเอียดและสถานะเซนเซอร์แบบเรียลไทม์
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            การวิเคราะห์ระดับความเหมาะสมของสภาพแวดล้อมห้องนอนเทียบกับเกณฑ์มาตรฐานสุขภาพ
          </p>
        </div>

        {/* Detailed Sensor Bento Grid */}
        <div className="sensor-grid">
          {/* Temperature */}
          <div style={{
            backgroundColor: '#151c2c',
            padding: '22px',
            borderRadius: '20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>🌡️ อุณหภูมิ (Temperature)</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: tempSt.color,
                backgroundColor: tempSt.bg,
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                {tempSt.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc' }}>
                {sensor ? `${sensor.temperature?.toFixed(1)}` : '--'}
              </span>
              <span style={{ fontSize: '16px', color: '#64748b' }}>°C</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>ช่วงเกณฑ์มาตรฐานสำหรับการหลับสนิท:</span>
              <strong style={{ color: '#cbd5e1' }}>22.0 - 25.0 °C</strong>
            </div>
          </div>

          {/* Humidity */}
          <div style={{
            backgroundColor: '#151c2c',
            padding: '22px',
            borderRadius: '20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>💧 ความชื้น (Humidity)</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: humSt.color,
                backgroundColor: humSt.bg,
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                {humSt.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc' }}>
                {sensor ? `${sensor.humidity?.toFixed(0)}` : '--'}
              </span>
              <span style={{ fontSize: '16px', color: '#64748b' }}>%</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>ช่วงเกณฑ์มาตรฐาน:</span>
              <strong style={{ color: '#cbd5e1' }}>40 - 60 %RH</strong>
            </div>
          </div>

          {/* CO2 */}
          <div style={{
            backgroundColor: '#151c2c',
            padding: '22px',
            borderRadius: '20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>🍃 คาร์บอนไดออกไซด์ (CO2)</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: co2St.color,
                backgroundColor: co2St.bg,
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                {co2St.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc' }}>
                {sensor ? `${sensor.co2}` : '--'}
              </span>
              <span style={{ fontSize: '14px', color: '#64748b' }}>ppm</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>เกณฑ์มาตรฐานความปลอดภัย:</span>
              <strong style={{ color: '#cbd5e1' }}>น้อยกว่า 800 ppm</strong>
            </div>
          </div>

          {/* Ambient Light */}
          <div style={{
            backgroundColor: '#151c2c',
            padding: '22px',
            borderRadius: '20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>💡 ความสว่างแสง (Ambient Light)</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: luxSt.color,
                backgroundColor: luxSt.bg,
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                {luxSt.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc' }}>
                {sensor ? `${sensor.lux?.toFixed(1)}` : '--'}
              </span>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Lux</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>เกณฑ์ปลอดภัยต่อเมลาโทนิน:</span>
              <strong style={{ color: '#cbd5e1' }}>น้อยกว่า 5.0 Lux</strong>
            </div>
          </div>

          {/* PM2.5 */}
          <div style={{
            backgroundColor: '#151c2c',
            padding: '22px',
            borderRadius: '20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>🌫️ ฝุ่น PM 2.5</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: pmSt.color,
                backgroundColor: pmSt.bg,
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                {pmSt.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc' }}>
                {sensor ? `${sensor.pm2_5}` : '--'}
              </span>
              <span style={{ fontSize: '14px', color: '#64748b' }}>µg/m³</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>เกณฑ์มาตรฐานคุณภาพอากาศ:</span>
              <strong style={{ color: '#cbd5e1' }}>น้อยกว่า 15 µg/m³</strong>
            </div>
          </div>

          {/* Noise Sound */}
          <div style={{
            backgroundColor: '#151c2c',
            padding: '22px',
            borderRadius: '20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>🔊 ระดับเสียงแทรก (Sound Level)</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: (sensor?.sound ?? 0) < 1000 ? '#34d399' : '#f59e0b',
                backgroundColor: (sensor?.sound ?? 0) < 1000 ? '#10b98120' : '#f59e0b20',
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                {(sensor?.sound ?? 0) < 1000 ? '🟢 บรรยากาศเงียบสงบ' : '🟡 มีเสียงรบกวนแทรก'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#f8fafc' }}>
                {sensor ? `${sensor.sound}` : '--'}
              </span>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Raw Signal</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>เกณฑ์สัญญาณมาตรฐาน:</span>
              <strong style={{ color: '#cbd5e1' }}>น้อยกว่า 1000 Baseline</strong>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <Link href="/" style={{
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          padding: '16px',
          borderRadius: '16px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '13px',
          textDecoration: 'none',
          border: '1px solid #334155'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}