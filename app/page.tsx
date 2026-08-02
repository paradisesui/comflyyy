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
  const [aiAnalysis, setAiAnalysis] = useState<string>('กำลังให้ Gemini AI วิเคราะห์สภาพแวดล้อม...');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // ฟังก์ชันยิง Direct REST API ไปที่ Gemini (เสถียรสุด)
  const analyzeWithGemini = async (data: SensorData) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setAiAnalysis('ไม่พบ API Key กรุณาตรวจสอบการตั้งค่า Environment Variables');
      return;
    }

    try {
      setAiLoading(true);

      const promptText = `คุณเป็น AI ผู้เชี่ยวชาญด้านเวชศาสตร์การนอนและการจัดสภาพแวดล้อมห้องนอน 
โปรดวิเคราะห์ข้อมูลเซนเซอร์สภาพแวดล้อมห้องนอนปัจจุบันดังนี้:
- อุณหภูมิ: ${data.temperature?.toFixed(1) ?? '--'} °C
- ความชื้น: ${data.humidity?.toFixed(0) ?? '--'} %
- คาร์บอนไดออกไซด์ (CO2): ${data.co2 ?? '--'} ppm
- ฝุ่น PM2.5: ${data.pm2_5 ?? '--'} µg/m³
- แสงสว่าง: ${data.lux?.toFixed(1) ?? '--'} Lux
- ระดับเสียง: ${data.sound ?? '--'}

คำสั่ง:
1. ให้คำแนะนำสั้นๆ สรุปใจความสำคัญ ไม่เกิน 2-3 ประโยค ภาษาไทย เป็นกันเอง ชวนให้นอนหลับสบาย
2. หากมีค่าใดสุ่มเสี่ยง เช่น Temp > 26, CO2 > 800, Sound > 1500 หรือ แสงสว่าง ให้เจาะจงเตือนค่านั้นและบอกวิธีแก้สั้นๆ`;

      // ยิงตรงไปที่ Gemini 1.5 Flash REST API
      const res = await fetch(
        // ✅ แก้เป็น gemini-3-flash-preview
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: promptText }],
              },
            ],
          }),
        }
      );

      const json = await res.json();

      if (json.candidates && json.candidates[0]?.content?.parts[0]?.text) {
        setAiAnalysis(json.candidates[0].content.parts[0].text);
      } else if (json.error) {
        console.error('Gemini API Error Response:', json.error);
        setAiAnalysis(`ข้อผิดพลาดจาก AI: ${json.error.message || 'ไม่สามารถประมวลผลได้'}`);
      } else {
        setAiAnalysis('ไม่สามารถประมวลผลคำตอบจาก Gemini ได้');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      setAiAnalysis('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Gemini AI');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    try {
      const logsRef = ref(database, 'logs');
      const latestLogQuery = query(logsRef, limitToLast(1));
      const unsubscribe = onValue(
        latestLogQuery,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const latestKey = Object.keys(data)[0];
            const currentSensorData: SensorData = data[latestKey];

            setSensor(currentSensorData);
            // เรียกใช้ Gemini AI เมื่อได้รับข้อมูลใหม่
            analyzeWithGemini(currentSensorData);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Firebase Error:', error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  // คำนวณ Room Score
  const calculateScore = (data: SensorData | null) => {
    if (!data) return 97;
    let score = 100;
    if (data.temperature > 25) score -= Math.round((data.temperature - 25) * 2);
    if (data.co2 > 800) score -= 10;
    if (data.pm2_5 > 15) score -= 10;
    if (data.sound > 1000) score -= 5;
    return Math.max(0, Math.min(100, score));
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

        {/* Circular Score */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg transform="rotate(-90)" width="200" height="200" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="12" fill="transparent" />
              <circle
                cx="80" cy="80" r="70"
                stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
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
            <h2 style={{ fontSize: '24px', color: score >= 80 ? '#34d399' : '#f59e0b', fontWeight: '700', margin: '2px 0 0 0' }}>
              {score >= 80 ? 'ดีเยี่ยม' : score >= 60 ? 'ปานกลาง' : 'ควรปรับปรุง'}
            </h2>
          </div>
        </section>

        {/* Realtime Sensors Preview Grid */}
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
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>
              {sensor ? `${sensor.temperature?.toFixed(1)}°C` : '--'}
            </span>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid #1e293b', borderRight: '1px solid #1e293b' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>ความชื้น</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>
              {sensor ? `${sensor.humidity?.toFixed(0)}%` : '--'}
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>CO2</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>
              {sensor ? `${sensor.co2} ppm` : '--'}
            </span>
          </div>
        </div>

        {/* Gemini AI Recommendation Box */}
        <div style={{
          backgroundColor: '#162032',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid #10b98140',
          position: 'relative'
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#34d399', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ✨ Gemini AI วิเคราะห์สด
          </p>
          <p style={{ fontSize: '13px', color: aiLoading ? '#64748b' : '#cbd5e1', margin: 0, lineHeight: '1.5' }}>
            {aiLoading ? '🤖 Gemini กำลังประมวลผลคำแนะนำ...' : aiAnalysis}
          </p>
        </div>

        {/* Buttons */}
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