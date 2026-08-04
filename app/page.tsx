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

export default function Home() {
  const [sensor, setSensor] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiAnalysis, setAiAnalysis] = useState<string>('กดปุ่มเพื่อวิเคราะห์สภาพแวดล้อมห้องนอนด้วย Gemini AI');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const analyzeWithGemini = async (data: SensorData) => {
    if (cooldown > 0) return;

    try {
      setAiLoading(true);
      setAiAnalysis('กำลังประมวลผลคำแนะนำด้วย Gemini AI...');

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensorData: data }),
      });

      const json = await res.json();

      if (res.ok && json.result) {
        setAiAnalysis(json.result);
      } else {
        setAiAnalysis(json.error || json.details || 'ไม่สามารถประมวลผลคำแนะนำได้ในขณะนี้');
      }
    } catch (error) {
      setAiAnalysis('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setAiLoading(false);
      setCooldown(10);
    }
  };

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
    if (data.temperature > 25) score -= Math.round((data.temperature - 25) * 3);
    if (data.humidity > 60) score -= Math.round((data.humidity - 60) * 0.5);
    if (data.humidity < 40) score -= Math.round((40 - data.humidity) * 0.5);
    if (data.co2 > 800) score -= 10;
    if (data.pm2_5 > 15) score -= 10;
    if (data.lux > 5) score -= 10;
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const score = calculateScore(sensor);
  const strokeDashoffset = 440 - (440 * score) / 100;
  const statusColor = score >= 80 ? '#6366f1' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0f19',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <style jsx>{`
        .bento-container {
          width: 100%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .bottom-nav-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 900px) {
          .hero-grid {
            grid-template-columns: 380px 1fr;
            gap: 20px;
          }
          .metrics-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .bottom-nav-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
        }
      `}</style>

      <main className="bento-container">
        {/* Header Section */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', fontWeight: '600' }}>SLEEP ENVIRONMENT</span>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>Dashboard</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: loading ? '#f59e0b15' : '#6366f115',
              color: loading ? '#f59e0b' : '#818cf8',
              border: `1px solid ${loading ? '#f59e0b30' : '#6366f130'}`,
              fontWeight: '600'
            }}>
              {loading ? '• Syncing...' : '• Realtime Active'}
            </span>

            <Link href="/persona" style={{
              width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#1e293b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', border: '1px solid #334155'
            }}>
              ⌚
            </Link>
          </div>
        </header>

        {/* Primary Hero Section */}
        <div className="hero-grid">
          {/* Main Score Card (Minimal Clean Ring) */}
          <div style={{
            backgroundColor: '#151c2c',
            borderRadius: '24px',
            padding: '32px 20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}>
            <div style={{ position: 'relative', width: '190px', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg transform="rotate(-90)" width="190" height="190" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" stroke="#0f172a" strokeWidth="10" fill="transparent" />
                <circle
                  cx="80" cy="80" r="70"
                  stroke={statusColor}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="440"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '52px', fontWeight: '800', lineHeight: '1', color: '#fff' }}>{score}%</span>
                <span style={{ fontSize: '10px', color: '#64748b', letterSpacing: '2px', marginTop: '4px', fontWeight: '700' }}>SLEEP QUALITY</span>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>สภาวะห้องนอนปัจจุบัน</span>
              <h2 style={{ fontSize: '22px', color: statusColor, fontWeight: '700', margin: '2px 0 0 0' }}>
                {score >= 80 ? 'ดีเยี่ยม หลับสนิท' : score >= 60 ? 'ปานกลาง' : 'ควรปรับปรุง'}
              </h2>
            </div>
          </div>

          {/* 4 Metrics Bento Grid */}
          <div className="metrics-grid">
            {/* Temperature */}
            <div style={{ backgroundColor: '#151c2c', padding: '20px', borderRadius: '20px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>🌡️ Temperature</span>
              <div style={{ margin: '12px 0' }}>
                <span style={{ fontSize: '28px', fontWeight: '800', color: (sensor?.temperature ?? 0) > 25 ? '#f59e0b' : '#f8fafc' }}>
                  {sensor ? `${sensor.temperature?.toFixed(1)}°` : '--'}
                </span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>C</span>
              </div>
              <span style={{ fontSize: '11px', color: (sensor?.temperature ?? 0) <= 25 ? '#34d399' : '#f59e0b' }}>
                {(sensor?.temperature ?? 0) <= 25 ? '• เย็นสบาย เหมาะแก่การนอน' : '• อุณหภูมิค่อนข้างสูง'}
              </span>
            </div>

            {/* Humidity */}
            <div style={{ backgroundColor: '#151c2c', padding: '20px', borderRadius: '20px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>💧 Humidity</span>
              <div style={{ margin: '12px 0' }}>
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc' }}>
                  {sensor ? `${sensor.humidity?.toFixed(0)}` : '--'}
                </span>
                <span style={{ fontSize: '14px', color: '#64748b' }}>%</span>
              </div>
              <span style={{ fontSize: '11px', color: '#34d399' }}>• อยู่ในช่วงเกณฑ์มาตรฐาน</span>
            </div>

            {/* Air Quality (CO2) */}
            <div style={{ backgroundColor: '#151c2c', padding: '20px', borderRadius: '20px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>🍃 Air Quality (CO2)</span>
              <div style={{ margin: '12px 0' }}>
                <span style={{ fontSize: '28px', fontWeight: '800', color: (sensor?.co2 ?? 0) > 800 ? '#f59e0b' : '#f8fafc' }}>
                  {sensor ? `${sensor.co2}` : '--'}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>ppm</span>
              </div>
              <span style={{ fontSize: '11px', color: (sensor?.co2 ?? 0) < 800 ? '#34d399' : '#f59e0b' }}>
                {(sensor?.co2 ?? 0) < 800 ? '• อากาศถ่ายเทดี' : '• ควรระบายอากาศ'}
              </span>
            </div>

            {/* Light Level */}
            <div style={{ backgroundColor: '#151c2c', padding: '20px', borderRadius: '20px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>💡 Ambient Light</span>
              <div style={{ margin: '12px 0' }}>
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#f8fafc' }}>
                  {sensor ? `${sensor.lux?.toFixed(1)}` : '--'}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>Lux</span>
              </div>
              <span style={{ fontSize: '11px', color: '#34d399' }}>• มืดสนิท ปลอดภัยต่อเมลาโทนิน</span>
            </div>
          </div>
        </div>

        {/* AI Insight Bento Card */}
        <div style={{
          backgroundColor: '#151c2c',
          padding: '24px',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✨ Gemini AI Sleep Insight
            </span>
            <button
              onClick={() => sensor && analyzeWithGemini(sensor)}
              disabled={aiLoading || !sensor || cooldown > 0}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                backgroundColor: cooldown > 0 ? '#334155' : '#6366f1',
                color: '#fff',
                border: 'none',
                fontSize: '12px',
                fontWeight: '600',
                cursor: (aiLoading || cooldown > 0) ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.7 : 1
              }}
            >
              {aiLoading ? '🔄 กำลังวิเคราะห์...' : cooldown > 0 ? `⏳ รอ (${cooldown}s)` : 'วิเคราะห์สด'}
            </button>
          </div>
          <p style={{ fontSize: '14px', color: '#cbd5e1', margin: 0, lineHeight: '1.6' }}>
            {aiAnalysis}
          </p>
        </div>

        {/* Navigation Grid */}
        <footer className="bottom-nav-grid">
          <Link href="/sensors" style={{
            backgroundColor: '#151c2c',
            color: '#f8fafc',
            padding: '16px',
            borderRadius: '16px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '13px',
            textDecoration: 'none',
            border: '1px solid #1e293b'
          }}>
            รายละเอียดเซนเซอร์ทั้งหมด ➔
          </Link>
          <Link href="/history" style={{
            backgroundColor: '#151c2c',
            color: '#f8fafc',
            padding: '16px',
            borderRadius: '16px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '13px',
            textDecoration: 'none',
            border: '1px solid #1e293b'
          }}>
            ประวัติการใช้งานย้อนหลัง
          </Link>
        </footer>
      </main>
    </div>
  );
}