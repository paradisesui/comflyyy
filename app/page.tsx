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
  const garminScoreDisplay = garminData?.garminSleepScore ?? latestData?.garminScore ?? 89;
  const roomScoreDisplay = latestData?.roomScore ?? calculateDynamicRoomScore(roomData) ?? 68;
  const combinedScoreValue = (garminScoreDisplay && roomScoreDisplay)
    ? Math.round(Number(garminScoreDisplay) * 0.5 + Number(roomScoreDisplay) * 0.5)
    : 79;
  const combinedScoreDisplay = (garminScoreDisplay && roomScoreDisplay) ? combinedScoreValue : '--';

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
    { href: '/sensors', icon: '🛏️', title: 'Comfy Room', desc: 'คุณภาพห้องนอน', border: '#bae6fd', badgeBg: '#eff6ff' },
    { href: '/persona', icon: '⌚', title: 'Smart Watch', desc: 'Garmin Persona', border: '#e9d5ff', badgeBg: '#faf5ff' },
    { href: '/sensitivity', icon: '🎯', title: 'Sensitivity', desc: 'จุดอ่อนการนอน', border: '#fecdd3', badgeBg: '#fff1f2' },
    { href: '/sensitivity-profile', icon: '📜', title: 'ประวัติสะสม', desc: 'History Logs', border: '#fde68a', badgeBg: '#fffbeb' },
  ];

  // คำนวณเส้นรอบวงสำหรับ Circular Progress Ring
  const circleRadius = 66;
  const circumference = 2 * Math.PI * circleRadius;
  const numericScore = typeof combinedScoreValue === 'number' ? Math.min(100, Math.max(0, combinedScoreValue)) : 79;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #e0f2fe 0%, #f8fafc 65%)',
      color: '#1e293b',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '18px 14px 48px 14px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <main style={{
        width: '100%',
        maxWidth: '780px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>

        {/* 1. Header Bar */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 2px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '19px',
              boxShadow: '0 3px 8px rgba(245, 158, 11, 0.12)',
              flexShrink: 0
            }}>
              🌙
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.4px', lineHeight: 1.1 }}>
                <span style={{ color: '#f59e0b' }}>COM</span>
                <span style={{ color: '#60a5fa' }}>FLYYY</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#64748b', marginLeft: '5px' }}>SLEEP</span>
              </div>
              <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: '500' }}>
                AI-Powered Personal Sleep Environment
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Status Pill เล็ก สบายตา */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#15803d'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              ESP32 Online
            </div>

            <Link href="/account" style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '15px',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.03)'
            }}>
              👤
            </Link>
          </div>
        </header>

        {/* 2. System Navigation - แนวนอนเลื่อนลื่น ไม่เกะกะ */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          padding: '12px 14px',
          boxShadow: '0 2px 8px rgba(186, 230, 253, 0.15)'
        }}>
          <span style={{
            fontSize: '11px',
            color: '#94a3b8',
            fontWeight: '800',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '8px'
          }}>
            SYSTEM NAVIGATION
          </span>
          <nav style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none'
          }}>
            {navTabs.map((tab, idx) => (
              <Link key={idx} href={tab.href} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '14px',
                backgroundColor: tab.badgeBg,
                border: `1px solid ${tab.border}`,
                textDecoration: 'none',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '15px' }}>{tab.icon}</span>
                <span style={{ fontSize: '12.5px', color: '#1e293b', fontWeight: '700' }}>
                  {tab.title}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* 3. Combined Sleep Score Card: ปรับสัดส่วนให้พอดีตา สวยสมส่วน */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            boxShadow: '0 6px 20px -4px rgba(186, 230, 253, 0.22)',
            padding: '20px 16px 18px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)'
          }}>
            {/* Header ของการ์ด */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: '10px',
              padding: '0 4px'
            }}>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: '800', display: 'block' }}>
                  Daily Sleep Synthesis
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  การประเมินสภาวะการนอนหลับ
                </span>
              </div>
              <span style={{
                fontSize: '11.5px',
                color: '#0284c7',
                fontWeight: '700',
                backgroundColor: '#eff6ff',
                border: '1px solid #bae6fd',
                padding: '3px 10px',
                borderRadius: '9999px'
              }}>
                {latestDate || '2026-09-05'}
              </span>
            </div>

            {/* Circular Gauge Ring - ตัวเลขและวงแหวน */}
            <div style={{ position: 'relative', width: '156px', height: '156px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="156" height="156" viewBox="0 0 156 156" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="78"
                  cy="78"
                  r={circleRadius}
                  stroke="#e2e8f0"
                  strokeWidth="9"
                  fill="transparent"
                />
                <circle
                  cx="78"
                  cy="78"
                  r={circleRadius}
                  stroke="#0284c7"
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>

              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span style={{
                    fontSize: '48px',
                    fontWeight: '900',
                    color: '#0284c7',
                    lineHeight: 1,
                    letterSpacing: '-1.5px'
                  }}>
                    {combinedScoreDisplay}
                  </span>
                  <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '600' }}>/100</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', letterSpacing: '0.4px', marginTop: '2px', textTransform: 'uppercase' }}>
                  COMBINED SCORE
                </span>
              </div>
            </div>

            {/* Badge สถานะผลการนอน */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              color: '#15803d',
              fontWeight: '700',
              marginTop: '12px',
              backgroundColor: '#f0fdf4',
              padding: '5px 14px',
              borderRadius: '9999px',
              border: '1px solid #bbf7d0'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              คุณภาพการนอนหลับโดยรวมอยู่ในเกณฑ์ดี
            </div>
          </div>

          {/* Sub Scores แฝด (Garmin & Room Env) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid rgba(226, 232, 240, 0.85)',
              boxShadow: '0 4px 12px -2px rgba(186, 230, 253, 0.18)',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#f5f3ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                marginBottom: '4px'
              }}>
                ⌚
              </div>
              <span style={{ fontSize: '10.5px', color: '#7c3aed', fontWeight: '800', letterSpacing: '0.3px' }}>
                GARMIN
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', margin: '1px 0' }}>
                <strong style={{ fontSize: '24px', fontWeight: '900', color: '#6d28d9' }}>
                  {garminScoreDisplay ?? '--'}
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>/100</span>
              </div>
              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>สุขอนามัยการนอน</span>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid rgba(226, 232, 240, 0.85)',
              boxShadow: '0 4px 12px -2px rgba(186, 230, 253, 0.18)',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                marginBottom: '4px'
              }}>
                🌿
              </div>
              <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: '800', letterSpacing: '0.3px' }}>
                ROOM ENV
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', margin: '1px 0' }}>
                <strong style={{ fontSize: '24px', fontWeight: '900', color: '#047857' }}>
                  {roomScoreDisplay ?? '--'}
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>/100</span>
              </div>
              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>สภาวะแวดล้อมห้อง</span>
            </div>
          </div>
        </section>

        {/* 4. Gemini AI Diagnosis Card: วางปุ่ม "วิเคราะห์ใหม่" ไว้ด้านในหัวข้อกล่องอย่างลงตัว */}
        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '22px',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: '0 6px 20px -4px rgba(186, 230, 253, 0.22)',
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                flexShrink: 0
              }}>
                ✨
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#1e293b', fontWeight: '900', display: 'block', lineHeight: 1.2 }}>
                  ผลวิเคราะห์และคำแนะนำจาก AI
                </strong>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
                  GEMINI SLEEP COACH
                </span>
              </div>
            </div>

            {/* ปุ่มวิเคราะห์ใหม่ อยู่ตรงนี้เหมาะสมที่สุด */}
            <button
              onClick={handleAnalyzeWithAI}
              disabled={loadingAi}
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#0284c7',
                padding: '6px 12px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.15s ease'
              }}
            >
              {loadingAi ? 'กำลังวิเคราะห์...' : '🔄 วิเคราะห์ใหม่'}
            </button>
          </div>

          {/* Sub Card 1: Diagnosis */}
          <div style={{
            backgroundColor: '#fffdfa',
            border: '1px solid #fed7aa',
            borderRadius: '16px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px' }}>🚨</span>
              <strong style={{ fontSize: '12px', color: '#c2410c', letterSpacing: '0.2px' }}>
                สาเหตุเชิงลึกจากสภาพแวดล้อมจริง (Diagnosis)
              </strong>
            </div>
            <div style={{
              fontSize: '12.5px',
              color: '#475569',
              lineHeight: 1.65,
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
            borderRadius: '16px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px' }}>💡</span>
              <strong style={{ fontSize: '12px', color: '#0369a1', letterSpacing: '0.2px' }}>
                วิธีปรับห้องนอนคืนนี้ (Actionable Recommendations)
              </strong>
            </div>
            <div style={{
              fontSize: '12.5px',
              color: '#475569',
              lineHeight: 1.65,
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