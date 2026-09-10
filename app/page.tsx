'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function HomePage() {
  const [latestDate, setLatestDate] = useState<string>('');
  const [latestData, setLatestData] = useState<any>(null);
  const [garminData, setGarminData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // ฟังก์ชันคำนวณ Room Score จากค่าเฉลี่ยเซนเซอร์ตามสูตร Comfy Room
  const calculateDynamicRoomScore = (data: any) => {
    if (!data) return null;
    let score = 100;

    // 1. CO2
    const co2 = Number(data.co2 || 0);
    if (co2 > 1000) score -= Math.min(30, Math.round((co2 - 1000) / 30));

    // 2. อุณหภูมิ (เป้าหมาย 23-25 °C)
    const temp = Number(data.temperature || data.temp || 0);
    if (temp > 0) {
      if (temp < 23) score -= Math.min(20, Math.round((23 - temp) * 5));
      else if (temp > 25) score -= Math.min(20, Math.round((temp - 25) * 5));
    }

    // 3. ความชื้น (เป้าหมาย 50-60%)
    const hum = Number(data.humidity || data.hum || 0);
    if (hum > 0) {
      if (hum < 50) score -= Math.min(15, Math.round((50 - hum) * 1.5));
      else if (hum > 60) score -= Math.min(15, Math.round((hum - 60) * 1.5));
    }

    // 4. เสียง (Raw ADC / dB)
    const sound = Number(data.sound || data.sound_db || 0);
    if (sound > 60) score -= Math.min(20, 15);

    return Math.max(20, Math.min(100, score));
  };

  useEffect(() => {
    if (!database) return;

    // 1. ดึงประวัติเพื่อหาวันล่าสุด
    const historyRef = ref(database, 'personal_sensitivity/history');
    const unsubHistory = onValue(historyRef, (snapshot) => {
      let targetDate = '2026-08-16';

      if (snapshot.exists()) {
        const val = snapshot.val();
        const dates = Object.keys(val).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        if (dates.length > 0) {
          targetDate = dates[0];
          setLatestData(val[targetDate]);
        }
      }
      setLatestDate(targetDate);

      // ดึงข้อมูล Garmin
      const garminRef = ref(database, `garmin_sleep/${targetDate}`);
      onValue(garminRef, (gSnap) => {
        if (gSnap.exists()) setGarminData(gSnap.val());
      });

      // ดึงข้อมูล Room Env เซนเซอร์จริง
      const roomRef = ref(database, `room_env/${targetDate}`);
      onValue(roomRef, (rSnap) => {
        if (rSnap.exists()) setRoomData(rSnap.val());
      });

      // ดึงข้อมูล Sensitivity Event
      const eventRef = ref(database, `personal_sensitivity/all_sensors_events/${targetDate}`);
      onValue(eventRef, (eSnap) => {
        if (eSnap.exists()) setEventData(eSnap.val());
      });

      // ดึงบทวิเคราะห์ AI
      const summaryRef = ref(database, 'personal_sensitivity/summary');
      onValue(summaryRef, (sumSnap) => {
        if (sumSnap.exists() && sumSnap.val()?.aiInsight) {
          setAiInsight(sumSnap.val().aiInsight);
        }
      });
    });

    return () => unsubHistory();
  }, []);

  // คำนวณคะแนนแบบ Dynamic Fallback
  const garminScoreDisplay = garminData?.garminSleepScore ?? latestData?.garminScore ?? 93;
  const roomScoreDisplay = latestData?.roomScore ?? calculateDynamicRoomScore(roomData) ?? 68;
  const combinedScoreDisplay = (garminScoreDisplay && roomScoreDisplay)
    ? Math.round(Number(garminScoreDisplay) * 0.5 + Number(roomScoreDisplay) * 0.5)
    : '--';

  const handleAnalyzeWithAI = async () => {
    if (!latestDate) return;
    setLoadingAi(true);

    try {
      const payload = {
        date: latestDate,
        sensorAverages: roomData || { co2: 1432, temp: 22.8, hum: 65.2, pm25: 0, sound: 1804, light: 0 },
        garminData: garminData || {
          garminSleepScore: garminScoreDisplay,
          restlessMomentsCount: latestData?.restlessCount || 12,
          durationInSeconds: 24000,
          avgSleepStress: 15,
        },
        sensitivityProfile: {
          sensitivityScore: eventData?.overallSensitivityScore || 45,
          triggerBreakdown: eventData?.sensorTriggerBreakdown || { co2: 5, humidity: 4, sound_db: 3 }
        }
      };

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resJson = await res.json();
      if (resJson?.data) {
        setAiInsight(resJson.data);
        if (database) {
          set(ref(database, 'personal_sensitivity/summary/aiInsight'), resJson.data);
        }
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const navTabs = [
    { href: '/sensors', icon: '🛏️', title: 'Comfy Room', desc: 'คุณภาพห้องนอน' },
    { href: '/persona', icon: '⌚', title: 'Smart Watch', desc: 'Garmin Persona' },
    { href: '/sensitivity', icon: '🎯', title: 'Sensitivity', desc: 'จุดอ่อนการนอน' },
    { href: '/sensitivity-profile', icon: '📜', title: 'ประวัติสะสม', desc: 'History Logs' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #e0f2fe 0%, #f8fafc 65%)',
      color: '#1e293b',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '36px 16px 64px 16px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .app-container {
          width: 100%;
          max-width: 960px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px 4px 4px;
        }
        /* แถบ Segmented แบบ Solid Flat ไม่มีความโปร่งใส */
        .segmented-nav {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 6px;
          background-color: #e2e8f0;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
        }
        @media (min-width: 768px) {
          .segmented-nav {
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            border-radius: 9999px;
          }
        }
        .clean-card {
          background-color: #ffffff;
          border-radius: 28px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px -2px #e0f2fe;
        }
      `}</style>

      <main className="app-container">
        {/* Header Bar */}
        <header className="header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              🌙
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '0.5px', lineHeight: 1.1 }}>
                <span style={{ color: '#f59e0b' }}>COM</span>
                <span style={{ color: '#60a5fa' }}>FLYYY</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#64748b', marginLeft: '8px' }}>SLEEP</span>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                AI-Powered Personal Sleep Environment
              </span>
            </div>
          </div>

          <Link href="/account" style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '16px'
          }}>
            👤
          </Link>
        </header>

        {/* 4 Navigation Buttons: แบบที่ 2 ทึบสนิท Solid Clean */}
        <nav className="segmented-nav">
          {navTabs.map((tab, idx) => (
            <Link key={idx} href={tab.href} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              transition: 'background-color 0.15s ease'
            }}>
              <span style={{ fontSize: '18px' }}>{tab.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '13.5px', color: '#1e293b', fontWeight: '800', display: 'block', lineHeight: 1.2 }}>
                  {tab.title}
                </strong>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                  {tab.desc}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Combined Sleep Score Card */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="clean-card" style={{
            padding: '36px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            backgroundColor: '#ffffff'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              padding: '6px 18px',
              borderRadius: '9999px',
              marginBottom: '16px'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
              <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: '800', letterSpacing: '0.4px' }}>
                COMBINED SLEEP SCORE ({latestDate || '2026-08-16'})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0' }}>
              <span style={{
                fontSize: '84px',
                fontWeight: '900',
                color: '#0284c7',
                lineHeight: 1,
                letterSpacing: '-2px'
              }}>
                {combinedScoreDisplay}
              </span>
              <span style={{ fontSize: '22px', color: '#94a3b8', fontWeight: '600' }}>/ 100</span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#15803d',
              fontWeight: '700',
              marginTop: '16px',
              backgroundColor: '#f0fdf4',
              padding: '6px 20px',
              borderRadius: '9999px',
              border: '1px solid #bbf7d0'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              คุณภาพการนอนหลับโดยรวมอยู่ในเกณฑ์ดี
            </div>
          </div>

          {/* Sub Scores แฝด (Garmin & Room Env) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="clean-card" style={{
              padding: '22px 18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#f5f3ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                marginBottom: '6px'
              }}>
                ⌚
              </div>
              <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '800', letterSpacing: '0.3px' }}>
                GARMIN SCORE
              </span>
              <strong style={{ fontSize: '34px', fontWeight: '900', color: '#6d28d9', margin: '2px 0' }}>
                {garminScoreDisplay ?? '--'}
              </strong>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>คะแนนจากนาฬิกา</span>
            </div>

            <div className="clean-card" style={{
              padding: '22px 18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                marginBottom: '6px'
              }}>
                🌿
              </div>
              <span style={{ fontSize: '12px', color: '#059669', fontWeight: '800', letterSpacing: '0.3px' }}>
                ROOM ENV SCORE
              </span>
              <strong style={{ fontSize: '34px', fontWeight: '900', color: '#047857', margin: '2px 0' }}>
                {roomScoreDisplay ?? '--'}
              </strong>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>คะแนนสภาพแวดล้อม</span>
            </div>
          </div>
        </section>

        {/* Gemini AI Diagnosis Card - Flat Pastel Tint ทึบสนิท */}
        <section className="clean-card" style={{
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px'
              }}>
                ✨
              </div>
              <div>
                <strong style={{ fontSize: '15.5px', color: '#1e293b', fontWeight: '900', display: 'block' }}>
                  ผลวิเคราะห์และคำแนะนำจาก AI
                </strong>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                  GEMINI SLEEP COACH
                </span>
              </div>
            </div>

            <button
              onClick={handleAnalyzeWithAI}
              disabled={loadingAi}
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#0284c7',
                padding: '6px 16px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {loadingAi ? 'กำลังวิเคราะห์...' : '🔄 วิเคราะห์ใหม่'}
            </button>
          </div>

          {/* Sub Card 1: Diagnosis */}
          <div style={{
            backgroundColor: '#fffdfa',
            border: '1px solid #fed7aa',
            borderRadius: '20px',
            padding: '18px 22px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px' }}>🚨</span>
              <strong style={{ fontSize: '13px', color: '#c2410c', letterSpacing: '0.2px' }}>
                สาเหตุเชิงลึกจากสภาพแวดล้อมจริง (Diagnosis)
              </strong>
            </div>
            <div style={{
              fontSize: '13.5px',
              color: '#475569',
              lineHeight: 1.75,
              fontWeight: '450',
              whiteSpace: 'pre-line'
            }}>
              {aiInsight?.diagnosis || "ระบบกำลังเชื่อมโยงปัจจัยสภาพแวดล้อมเพื่อสรุปสาเหตุ..."}
            </div>
          </div>

          {/* Sub Card 2: Actionable Recommendations */}
          <div style={{
            backgroundColor: '#f8fbff',
            border: '1px solid #bae6fd',
            borderRadius: '20px',
            padding: '18px 22px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px' }}>💡</span>
              <strong style={{ fontSize: '13px', color: '#0369a1', letterSpacing: '0.2px' }}>
                วิธีปรับห้องนอนคืนนี้ (Actionable Recommendations)
              </strong>
            </div>
            <div style={{
              fontSize: '13.5px',
              color: '#475569',
              lineHeight: 1.75,
              whiteSpace: 'pre-line'
            }}>
              {aiInsight?.recommendation || "1. แง้มประตูหรือเปิดพัดลมดูดอากาศเพื่อลดค่า CO2\n2. ปรับอุณหภูมิห้องให้อยู่ที่ 24-25°C"}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}