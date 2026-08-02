'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface SensorData {
  temperature: number;
  humidity: number;
  co2: number;
  lux: number;
  pm2_5: number;
  sound: number;
}

export default function Home() {
  const [sensor, setSensor] = useState<SensorData>({
    temperature: 0,
    humidity: 0,
    co2: 0,
    lux: 0,
    pm2_5: 0,
    sound: 0,
  });

  const [aiAdvice, setAiAdvice] = useState<string>('กำลังเตรียมข้อมูลวิเคราะห์...');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [lastFetchedTime, setLastFetchedTime] = useState<number>(0);

  // 1. ดึงข้อมูล Realtime เซนเซอร์จาก Firebase
  useEffect(() => {
    const sensorRef = ref(database, 'current_sensor');
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSensor(data);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. ฟังก์ชันยิงขอคำแนะนำจาก Gemini AI (จำกัดไม่เกิน 1 ครั้งในทุก 2 นาที)
  const getAiRecommendation = async (force: boolean = false) => {
    const now = Date.now();
    // ถ้าไม่ได้กด Manual และยิงไปเมื่อไม่ถึง 2 นาที (120,000 ms) ให้ข้าม
    if (!force && now - lastFetchedTime < 120000 && lastFetchedTime !== 0) {
      return;
    }

    // หากยังไม่มีข้อมูลเซนเซอร์จริง ให้ข้ามไปก่อน
    if (sensor.temperature === 0 && sensor.co2 === 0) return;

    setAiLoading(true);

    try {
      const promptText = `คุณเป็น AI ผู้เชี่ยวชาญด้านสภาพแวดล้อมการนอน (Sleep Environment Expert)
โปรดประเมินค่าเซนเซอร์ห้องนอน ณ ปัจจุบันดังนี้:
- อุณหภูมิ: ${sensor.temperature} °C
- ความชื้น: ${sensor.humidity} %
- คาร์บอนไดออกไซด์ (CO2): ${sensor.co2} ppm
- เสียง: ${sensor.sound} dB
- แสง: ${sensor.lux} Lux
- ฝุ่น PM2.5: ${sensor.pm2_5} µg/m³

คำสั่ง:
ให้สรุปสภาพแวดล้อมสั้นๆ ไม่เกิน 2-3 บรรทัด ว่าเหมาะกับการนอนหรือไม่ และควรปรับปรุงสิ่งใดทันทีด้วยน้ำเสียงที่เป็นมิตร`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await res.json();

      if (res.ok && data.result) {
        setAiAdvice(data.result);
        setLastFetchedTime(now);
      } else {
        // หากติด Quota Exceeded ให้โชว์ข้อความที่เป็นมิตร
        if (data.error && data.error.includes('quota')) {
          setAiAdvice('⚠️ ระบบขออภัย โควต้าคำนวณ AI ชั่วคราวเต็มแล้ว กรุณารอประมาณ 1 นาทีแล้วกดลองใหม่อีกครั้ง');
        } else {
          setAiAdvice('⚠️ ไม่สามารถดึงข้อมูลวิเคราะห์ได้ในขณะนี้');
        }
      }
    } catch (err) {
      console.error(err);
      setAiAdvice('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setAiLoading(false);
    }
  };

  // 3. ยิงขอคำแนะนำเมื่อเซนเซอร์เปลี่ยนแปลงครั้งแรก
  useEffect(() => {
    if (sensor.temperature !== 0 && lastFetchedTime === 0) {
      getAiRecommendation();
    }
  }, [sensor]);

  // คำนวณ Room Score เบื้องต้น
  const calculateScore = () => {
    let score = 100;
    if (sensor.temperature > 26) score -= 10;
    if (sensor.co2 > 800) score -= 15;
    if (sensor.humidity > 65 || sensor.humidity < 40) score -= 5;
    if (sensor.sound > 45) score -= 10;
    return Math.max(score, 0);
  };

  const roomScore = calculateScore();

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
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
            Live Realtime
          </span>
          <Link href="/account" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '18px' }}>
            👤
          </Link>
        </header>

        {/* Room Score Gauge */}
        <section style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            border: '8px solid #10b981',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto'
          }}>
            <span style={{ fontSize: '36px', fontWeight: '800' }}>{roomScore}%</span>
            <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px' }}>ROOM SCORE</span>
          </div>
          <p style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>ระดับคุณภาพห้องนอน</p>
          <h3 style={{ fontSize: '20px', color: '#10b981', margin: '4px 0 0 0', fontWeight: '700' }}>
            {roomScore >= 80 ? 'ดีเยี่ยม' : roomScore >= 60 ? 'ปานกลาง' : 'ควรปรับปรุง'}
          </h3>
        </section>

        {/* Quick Sensors Grid */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px',
          backgroundColor: '#162032',
          padding: '12px',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div>
            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>อุณหภูมิ</span>
            <strong style={{ fontSize: '14px' }}>{sensor.temperature}°C</strong>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>ความชื้น</span>
            <strong style={{ fontSize: '14px' }}>{sensor.humidity}%</strong>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>CO2</span>
            <strong style={{ fontSize: '14px' }}>{sensor.co2} ppm</strong>
          </div>
        </section>

        {/* Gemini AI Box */}
        <section style={{
          backgroundColor: '#162032',
          padding: '16px',
          borderRadius: '20px',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#34d399' }}>
              ✨ Gemini AI วิเคราะห์สด
            </span>
            <button
              onClick={() => getAiRecommendation(true)}
              disabled={aiLoading}
              style={{
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                border: '1px solid #334155',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              {aiLoading ? 'กำลังคิด...' : '🔄 อัปเดต'}
            </button>
          </div>

          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-line' }}>
            {aiLoading ? 'กำลังประมวลผลคำแนะนำจากสภาพแวดล้อม...' : aiAdvice}
          </p>
        </section>

        {/* Navigation Buttons */}
        <footer style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link href="/persona" style={{
            backgroundColor: '#10b981',
            color: '#022c22',
            padding: '12px',
            borderRadius: '14px',
            textAlign: 'center',
            fontWeight: '700',
            textDecoration: 'none',
            fontSize: '14px'
          }}>
            ดูวิเคราะห์ความ Sensitive เฉพาะบุคคล →
          </Link>

          <Link href="/account" style={{
            backgroundColor: '#162032',
            color: '#94a3b8',
            padding: '12px',
            borderRadius: '14px',
            textAlign: 'center',
            fontWeight: '600',
            textDecoration: 'none',
            fontSize: '14px',
            border: '1px solid #1e293b'
          }}>
            จัดการบัญชีผู้ใช้งาน
          </Link>
        </footer>
      </main>
    </div>
  );
}