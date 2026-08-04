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
      alignItems: 'center',
      padding: '28px'
    }}>
      <main style={{
        width: '100%',
        maxWidth: '1200px', // ปรับขยายกว้างขึ้นสำหรับหน้าจอคอมพิวเตอร์
        backgroundColor: '#0f172a',
        borderRadius: '32px',
        border: '1px solid #1e293b',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px'
      }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: loading ? '#f59e0b' : '#10b981',
              boxShadow: loading ? '0 0 12px #f59e0b' : '0 0 12px #10b981'
            }}></span>
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
              {loading ? 'กำลังเชื่อมต่อ...' : 'Live Realtime'}
            </span>
          </div>
          
          {/* ปุ่มโปรไฟล์เหลือเฉพาะไอคอน 👤 */}
          <Link href="/account" style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            fontSize: '18px',
            border: '1px solid #334155',
            transition: 'all 0.2s ease'
          }}>
            👤
          </Link>
        </header>

        {/* Responsive Grid Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '28px',
          alignItems: 'stretch'
        }}>
          {/* Card 1: Score & Overview */}
          <section style={{
            backgroundColor: '#162032',
            borderRadius: '24px',
            padding: '28px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px'
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
                <span style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1', color: '#fff' }}>{score}%</span>
                <span style={{ fontSize: '10px', color: '#64748b', letterSpacing: '2px', marginTop: '4px', fontWeight: '600' }}>ROOM SCORE</span>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>ระดับคุณภาพห้องนอน</span>
              <h2 style={{ fontSize: '24px', color: statusColor, fontWeight: '700', margin: '2px 0 0 0' }}>
                {score >= 80 ? 'ดีเยี่ยม' : score >= 60 ? 'ปานกลาง' : 'ควรปรับปรุง'}
              </h2>
            </div>
          </section>

          {/* Card 2: Sensors & AI Analysis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'space-between' }}>
            {/* Quick Sensors Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '14px',
              backgroundColor: '#162032',
              padding: '18px',
              borderRadius: '24px',
              border: '1px solid #1e293b'
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>อุณหภูมิ</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: (sensor?.temperature ?? 0) > 25 ? '#f59e0b' : '#f1f5f9' }}>
                  {sensor ? `${sensor.temperature?.toFixed(1)}°C` : '--'}
                </span>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid #1e293b', borderRight: '1px solid #1e293b' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>ความชื้น</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: (sensor?.humidity ?? 0) > 60 || (sensor?.humidity ?? 0) < 40 ? '#f59e0b' : '#f1f5f9' }}>
                  {sensor ? `${sensor.humidity?.toFixed(0)}%` : '--'}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>CO2</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: (sensor?.co2 ?? 0) > 800 ? '#f59e0b' : '#f1f5f9' }}>
                  {sensor ? `${sensor.co2} ppm` : '--'}
                </span>
              </div>
            </div>

            {/* AI Recommendation Box */}
            <div style={{
              backgroundColor: '#162032',
              padding: '22px',
              borderRadius: '24px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flexGrow: 1
            }}>
              <p style={{
                fontSize: '15px',
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
                fontSize: '14px',
                color: aiLoading ? '#64748b' : '#cbd5e1',
                margin: 0,
                lineHeight: '1.6'
              }}>
                {aiAnalysis}
              </p>
            </div>

            {/* Analyze Button */}
            <button
              onClick={() => sensor && analyzeWithGemini(sensor)}
              disabled={aiLoading || !sensor || cooldown > 0}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: cooldown > 0 ? '#334155' : '#10b981',
                color: cooldown > 0 ? '#94a3b8' : '#022c22',
                border: 'none',
                borderRadius: '18px',
                fontWeight: '700',
                fontSize: '15px',
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

        {/* Footer Quick Links */}
        <footer style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginTop: '4px'
        }}>
          <Link href="/sensors" style={{
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            padding: '16px',
            borderRadius: '18px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '14px',
            textDecoration: 'none',
            border: '1px solid #334155'
          }}>
            ดูรายละเอียดเซนเซอร์ทั้งหมด ➔
          </Link>
          <Link href="/persona" style={{
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            padding: '16px',
            borderRadius: '18px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '14px',
            textDecoration: 'none',
            border: '1px solid #334155'
          }}>
            ประวัติการใช้งาน & Smart Watch
          </Link>
        </footer>
      </main>
    </div>
  );
}