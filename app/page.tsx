'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

export default function Home() {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [co2, setCo2] = useState<number | null>(null);
  const [light, setLight] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number>(97);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 🔗 เชื่อมต่อไปยัง node 'logs' ใน Firebase
    const logsRef = ref(database, 'logs');

    const unsubscribe = onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        // 🔍 ดึงคีย์ล่าสุดจากรายการ logs ทั้งหมด
        const keys = Object.keys(data);
        const latestKey = keys[keys.length - 1];
        const latestData = data[latestKey] || data;

        // 📊 อัปเดต State จากข้อมูลล่าสุด
        const tempVal = latestData.temperature ?? latestData.temp ?? null;
        const humVal = latestData.humidity ?? latestData.hum ?? null;
        const co2Val = latestData.co2 ?? null;
        const lightVal = latestData.light ?? latestData.lux ?? null;

        setTemperature(tempVal);
        setHumidity(humVal);
        setCo2(co2Val);
        setLight(lightVal);

        // 🧠 คำนวณ Sleep Quality คร่าวๆ จากอุณหภูมิและความชื้น
        if (tempVal !== null && humVal !== null) {
          let score = 100;
          if (tempVal < 22 || tempVal > 26) score -= 10;
          if (humVal < 40 || humVal > 60) score -= 10;
          setSleepQuality(Math.max(60, score));
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error reading logs from Firebase:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px'
    }}>
      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .grid-main {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .grid-main {
            grid-template-columns: 1fr;
          }
        }

        .grid-sensors {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .card {
          background-color: #151c2c;
          border: 1px solid #1e293b;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
        }

        .sensor-value {
          font-size: 28px;
          font-weight: 800;
          margin: 10px 0 4px 0;
          color: #f8fafc;
        }

        .badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          margin-top: 6px;
        }

        .badge-good {
          color: #34d399;
          background-color: #10b98115;
          border: 1px solid #10b98130;
        }

        .nav-btn {
          color: #f8fafc;
          background-color: #1e293b;
          padding: 8px 16px;
          border-radius: 12px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s;
        }

        .nav-btn:hover {
          background-color: #334155;
        }
      `}</style>

      <div className="dashboard-container">
        {/* Header Section */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>🌙</span>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>COMFLYY</h1>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, letterSpacing: '1px' }}>
                SLEEP ENVIRONMENT DASHBOARD
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-good" style={{ padding: '6px 12px', fontSize: '12px' }}>
              • Realtime Active
            </span>
            <Link href="/sensors" className="nav-btn">
              ⌚ Smart Watch
            </Link>
            <Link href="/account" className="nav-btn" style={{ padding: '8px 12px' }}>
              👤
            </Link>
          </div>
        </header>

        {/* Main Grid Section */}
        <div className="grid-main">
          {/* Sleep Quality Score Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px 20px' }}>
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '8px solid #6366f1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '36px', fontWeight: '900', color: '#f8fafc' }}>{sleepQuality}%</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '0.5px' }}>SLEEP QUALITY</span>
            </div>

            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 4px 0' }}>สภาวะห้องนอนปัจจุบัน</p>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8', margin: 0 }}>
              ดีเยี่ยม หลับสนิท
            </h3>
          </div>

          {/* Sensor Cards Grid */}
          <div className="grid-sensors">
            {/* Temperature */}
            <div className="card">
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>🌡️ Temp</span>
              <div className="sensor-value">
                {loading ? '...' : temperature !== null ? `${temperature}°C` : '--°C'}
              </div>
              <span className="badge badge-good">• เหมาะสม</span>
            </div>

            {/* Humidity */}
            <div className="card">
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>💧 Humidity</span>
              <div className="sensor-value">
                {loading ? '...' : humidity !== null ? `${humidity}%` : '--%'}
              </div>
              <span className="badge badge-good">• ปกติ</span>
            </div>

            {/* CO2 */}
            <div className="card">
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>🍃 CO2</span>
              <div className="sensor-value">
                {loading ? '...' : co2 !== null ? `${co2} ppm` : '-- ppm'}
              </div>
              <span className="badge badge-good">• อากาศดี</span>
            </div>

            {/* Light */}
            <div className="card">
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>💡 Light</span>
              <div className="sensor-value">
                {loading ? '...' : light !== null ? `${light} Lux` : '-- Lux'}
              </div>
              <span className="badge badge-good">• มืดสนิท</span>
            </div>
          </div>
        </div>

        {/* Sensitivity & Info Card */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
              🎯 จุดอ่อนความไวการนอน (Sensitivity)
            </span>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              พบบางช่วง <span style={{ color: '#fb923c', fontWeight: '700' }}>อุณหภูมิ (High Sensitivity)</span> มากที่สุด
            </p>
          </div>
          <Link href="/sensitivity" className="nav-btn" style={{ padding: '8px 12px' }}>
            ➔
          </Link>
        </div>

        {/* AI Recommendations Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
              ✨ คำแนะนำการนอนหลับจาก AI
            </span>
            <button style={{
              backgroundColor: '#6366f1',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}>
              รับคำแนะนำ
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            กดปุ่มเพื่อขอรับคำแนะนำการปรับสภาพแวดล้อมห้องนอนจาก AI
          </p>
        </div>

        {/* Footer Navigation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
          <Link href="/sensors" className="card" style={{ textAlign: 'center', textDecoration: 'none', color: '#f8fafc', fontWeight: '700', fontSize: '13px' }}>
            รายละเอียดเซนเซอร์ทั้งหมด ➔
          </Link>
          <Link href="/history" className="card" style={{ textAlign: 'center', textDecoration: 'none', color: '#f8fafc', fontWeight: '700', fontSize: '13px' }}>
            ประวัติการใช้งานย้อนหลัง
          </Link>
        </div>
      </div>
    </div>
  );
}