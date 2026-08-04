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
  const [lastUpdated, setLastUpdated] = useState<string>('--:--');
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
      setAiAnalysis('กำลังวิเคราะห์สภาพแวดล้อมเพื่อสร้างคำแนะนำ...');

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensorData: data }),
      });

      const json = await res.json();

      if (res.ok && json.result) {
        setAiAnalysis(json.result);
      } else {
        console.error('Gemini API Error:', json);
        setAiAnalysis(json.error || json.details || 'ไม่สามารถประมวลผลคำแนะนำได้ในขณะนี้');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
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
          const currentSensorData: SensorData = data[latestKey];
          setSensor(currentSensorData);
          
          if (currentSensorData.timestamp) {
            setLastUpdated(new Date(currentSensorData.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          } else {
            setLastUpdated(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
          }
        }
        setLoading(false);
      }, (error) => {
        console.error('Firebase Error:', error);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
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
  const statusColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '16px 12px'
    }}>
      <style jsx>{`
        .dashboard-container {
          width: 100%;
          max-width: 1600px;
          background-color: #0f172a;
          border-radius: 24px;
          border: 1px solid #1e293b;
          padding: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .nav-links-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .footer-widgets-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .sensor-val {
          font-size: 17px;
          font-weight: 700;
          white-space: nowrap;
        }

        .score-num {
          font-size: 48px;
          font-weight: 800;
          line-height: 1;
          color: #fff;
        }

        /* Desktop Mode Layout */
        @media (min-width: 900px) {
          .dashboard-container {
            width: 96vw;
            padding: 40px;
            gap: 24px;
            margin-top: 20px;
            border-radius: 32px;
          }
          .dashboard-grid {
            grid-template-columns: 460px 1fr;
            gap: 28px;
          }
          .nav-links-grid {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .footer-widgets-grid {
            grid-template-columns: 1.2fr 1fr;
            gap: 20px;
          }
          .sensor-val {
            font-size: 26px;
            font-weight: 800;
          }
          .score-num {
            font-size: 72px;
          }
        }
      `}</style>

      <main className="dashboard-container">
        {/* Top Header */}
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

          {/* Header Quick Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/persona" style={{
              padding: '6px 12px',
              borderRadius: '16px',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: '600',
              border: '1px solid #334155'
            }}>
              ⌚ Smart Watch
            </Link>

            <Link href="/account" style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              fontSize: '16px',
              border: '1px solid #334155'
            }}>
              👤
            </Link>
          </div>
        </header>

        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Room Score Circular Chart */}
          <section style={{
            backgroundColor: '#162032',
            borderRadius: '20px',
            padding: '24px 16px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}>
            <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg transform="rotate(-90)" width="200" height="200" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" stroke="#0f172a" strokeWidth="12" fill="transparent" />
                <circle
                  cx="80" cy="80" r="70"
                  stroke={statusColor}
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="440"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="score-num">{score}%</span>
                <span style={{ fontSize: '10px', color: '#64748b', letterSpacing: '2px', marginTop: '4px', fontWeight: '600' }}>ROOM SCORE</span>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>ระดับคุณภาพห้องนอน</span>
              <h2 style={{ fontSize: '24px', color: statusColor, fontWeight: '700', margin: '2px 0 0 0' }}>
                {score >= 80 ? 'ดีเยี่ยม' : score >= 60 ? 'ปานกลาง' : 'ควรปรับปรุง'}
              </h2>
            </div>
          </section>

          {/* Key Sensors & AI Recommendation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'space-between' }}>
            {/* Primary Sensors Card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
              backgroundColor: '#162032',
              padding: '16px 8px',
              borderRadius: '18px',
              border: '1px solid #1e293b'
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>อุณหภูมิ</span>
                <span className="sensor-val" style={{ color: (sensor?.temperature ?? 0) > 25 ? '#f59e0b' : '#f1f5f9' }}>
                  {sensor ? `${sensor.temperature?.toFixed(1)}°C` : '--'}
                </span>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid #1e293b', borderRight: '1px solid #1e293b' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>ความชื้น</span>
                <span className="sensor-val" style={{ color: (sensor?.humidity ?? 0) > 60 || (sensor?.humidity ?? 0) < 40 ? '#f59e0b' : '#f1f5f9' }}>
                  {sensor ? `${sensor.humidity?.toFixed(0)}%` : '--'}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>CO2</span>
                <span className="sensor-val" style={{ color: (sensor?.co2 ?? 0) > 800 ? '#f59e0b' : '#f1f5f9' }}>
                  {sensor ? `${sensor.co2} ppm` : '--'}
                </span>
              </div>
            </div>

            {/* AI Recommendation Box */}
            <div style={{
              backgroundColor: '#162032',
              padding: '16px',
              borderRadius: '18px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexGrow: 1
            }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#34d399',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                💡 คำแนะนำเฉพาะคุณ
              </p>
              <p style={{
                fontSize: '13px',
                color: aiLoading ? '#64748b' : '#cbd5e1',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {aiAnalysis}
              </p>
            </div>

            {/* AI Action Button */}
            <button
              onClick={() => sensor && analyzeWithGemini(sensor)}
              disabled={aiLoading || !sensor || cooldown > 0}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: cooldown > 0 ? '#334155' : '#10b981',
                color: cooldown > 0 ? '#94a3b8' : '#022c22',
                border: 'none',
                borderRadius: '16px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: (aiLoading || cooldown > 0) ? 'not-allowed' : 'pointer',
                opacity: aiLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {aiLoading 
                ? '🔄 กำลังวิเคราะห์...' 
                : cooldown > 0 
                  ? `⏳ กรุณารอ (${cooldown}s)` 
                  : '🔄 วิเคราะห์สดด้วย Gemini'}
            </button>
          </div>
        </div>

        {/* Navigation Button Links */}
        <footer className="nav-links-grid">
          <Link href="/sensors" style={{
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            padding: '14px',
            borderRadius: '16px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '13px',
            textDecoration: 'none',
            border: '1px solid #334155'
          }}>
            รายละเอียดเซนเซอร์ทั้งหมด ➔
          </Link>
          <Link href="/history" style={{
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            padding: '14px',
            borderRadius: '16px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '13px',
            textDecoration: 'none',
            border: '1px solid #334155'
          }}>
            ประวัติการใช้งาน
          </Link>
        </footer>

        {/* Widgets ส่วนล่าง - จัดระเบียบใหม่ให้อ่านง่ายทั้งบนมือถือและคอมฯ */}
        <div className="footer-widgets-grid">
          {/* Widget 1: Heart Rate & Sleep Quality Sync */}
          <div style={{
            backgroundColor: '#162032',
            padding: '14px 16px',
            borderRadius: '18px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700' }}>
                ❤️ Heart Rate & Sleep Sync
              </span>
              <span style={{ fontSize: '10px', color: '#34d399', backgroundColor: '#10b98120', padding: '2px 6px', borderRadius: '8px', fontWeight: '700' }}>
                Garmin / Apple
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '12px', backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1px solid #1e293b', paddingRight: '8px' }}>
                <span style={{ fontSize: '9px', color: '#64748b' }}>Resting HR</span>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#f43f5e' }}>58-64 <span style={{ fontSize: '10px' }}>BPM</span></span>
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                อุณหภูมิห้อง <strong style={{ color: '#fff' }}>{sensor ? `${sensor.temperature?.toFixed(1)}°C` : '--'}</strong> ช่วยให้หัวใจทำงานผ่อนคลาย หลับสนิทง่ายขึ้น
              </div>
            </div>
          </div>

          {/* Widget 2: Device Health Status */}
          <div style={{
            backgroundColor: '#162032',
            padding: '14px 16px',
            borderRadius: '18px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '700' }}>
                📡 สถานะฮาร์ดแวร์ (Device Health)
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>ESP32</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '6px 10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>เซนเซอร์</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#34d399' }}>🟢 Online</span>
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '6px 10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Firebase</span>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#38bdf8' }}>⚡ Syncing</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
              <span>Smart Room v1.0</span>
              <span>อัปเดต: {lastUpdated} น.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}