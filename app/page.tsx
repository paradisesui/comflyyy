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
  const circleRadius = 78;
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
      padding: '24px 14px 60px 14px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <main style={{
        width: '100%',
        maxWidth: '960px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>

        {/* 1. Header Bar */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.12)',
              flexShrink: 0
            }}>
              🌙
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '0.4px', lineHeight: 1.1 }}>
                <span style={{ color: '#f59e0b' }}>COM</span>
                <span style={{ color: '#60a5fa' }}>FLYYY</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#64748b', marginLeft: '6px' }}>SLEEP</span>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                AI-Powered Personal Sleep Environment
              </span>
            </div>
          </div>

          <Link href="/account" style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '15px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            flexShrink: 0
          }}>
            👤
          </Link>
        </header>

        {/* 2. Navigation 4 ปุ่ม: รองรับทั้งแนวตั้งมือถือและ 4 คอลัมน์บนจอใหญ่ */}
        <nav style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px',
          width: '100%'
        }}>
          {navTabs.map((tab, idx) => (
            <Link key={idx} href={tab.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '18px',
              backgroundColor: '#ffffff',
              border: `1.5px solid ${tab.border}`,
              boxShadow: '0 2px 10px rgba(186, 230, 253, 0.18)',
              textDecoration: 'none',
              transition: 'transform 0.15s ease'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: tab.badgeBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}>
                {tab.icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <strong style={{
                  fontSize: '13.5px',
                  color: '#1e293b',
                  fontWeight: '800',
                  display: 'block',
                  lineHeight: 1.25
                }}>
                  {tab.title}
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                  {tab.desc}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        {/* 3. Combined Sleep Score Card: โฉมใหม่พร้อม Circular Progress Ring สมส่วน สวยงาม */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '26px',
            border: '1px solid rgba(226, 232, 240, 0.85)',
            boxShadow: '0 8px 24px -4px rgba(186, 230, 253, 0.28)',
            padding: '24px 16px 22px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)'
          }}>
            {/* หัวข้อขนาดกะทัดรัด ไม่แตกเป็น 2 บรรทัด */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#eff6ff',
              padding: '5px 14px',
              borderRadius: '9999px',
              marginBottom: '14px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
              <span style={{ fontSize: '11.5px', color: '#0369a1', fontWeight: '800', letterSpacing: '0.4px' }}>
                COMBINED SLEEP SCORE
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                • {latestDate || '2026-09-05'}
              </span>
            </div>

            {/* Circular Progress Ring พร้อมตัวเลขกึ่งกลาง */}
            <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r={circleRadius}
                  stroke="#e0f2fe"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Active Gradient/Solid Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r={circleRadius}
                  stroke="#0284c7"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>

              {/* Text Inside Circle */}
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  <span style={{
                    fontSize: '56px',
                    fontWeight: '900',
                    color: '#0284c7',
                    lineHeight: 1,
                    letterSpacing: '-1.5px'
                  }}>
                    {combinedScoreDisplay}
                  </span>
                  <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '600' }}>/100</span>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginTop: '4px' }}>
                  ภาพรวมคืนนี้
                </span>
              </div>
            </div>

            {/* Badge สถานะผลการนอน */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#15803d',
              fontWeight: '700',
              marginTop: '16px',
              backgroundColor: '#f0fdf4',
              padding: '6px 16px',
              borderRadius: '9999px',
              border: '1px solid #bbf7d0'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              คุณภาพการนอนหลับโดยรวมอยู่ในเกณฑ์ดี
            </div>
          </div>

          {/* Sub Scores แฝด (Garmin & Room Env) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '22px',
              border: '1px solid rgba(226, 232, 240, 0.85)',
              boxShadow: '0 4px 14px -2px rgba(186, 230, 253, 0.2)',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#f5f3ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                marginBottom: '4px'
              }}>
                ⌚
              </div>
              <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '800', letterSpacing: '0.3px' }}>
                GARMIN SCORE
              </span>
              <strong style={{ fontSize: '28px', fontWeight: '900', color: '#6d28d9', margin: '2px 0' }}>
                {garminScoreDisplay ?? '--'}
              </strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนจากนาฬิกา</span>
            </div>

            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '22px',
              border: '1px solid rgba(226, 232, 240, 0.85)',
              boxShadow: '0 4px 14px -2px rgba(186, 230, 253, 0.2)',
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                marginBottom: '4px'
              }}>
                🌿
              </div>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: '800', letterSpacing: '0.3px' }}>
                ROOM ENV SCORE
              </span>
              <strong style={{ fontSize: '28px', fontWeight: '900', color: '#047857', margin: '2px 0' }}>
                {roomScoreDisplay ?? '--'}
              </strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนสภาพแวดล้อม</span>
            </div>
          </div>
        </section>

        {/* 4. Gemini AI Diagnosis Card */}
        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: '0 6px 20px -4px rgba(186, 230, 253, 0.25)',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0
              }}>
                ✨
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#1e293b', fontWeight: '900', display: 'block', lineHeight: 1.2 }}>
                  ผลวิเคราะห์และคำแนะนำจาก AI
                </strong>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600' }}>
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
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
            >
              {loadingAi ? 'กำลังวิเคราะห์...' : '🔄 วิเคราะห์ใหม่'}
            </button>
          </div>

          {/* Sub Card 1: Diagnosis */}
          <div style={{
            backgroundColor: '#fffdfa',
            border: '1px solid #fed7aa',
            borderRadius: '18px',
            padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px' }}>🚨</span>
              <strong style={{ fontSize: '12.5px', color: '#c2410c', letterSpacing: '0.2px' }}>
                สาเหตุเชิงลึกจากสภาพแวดล้อมจริง (Diagnosis)
              </strong>
            </div>
            <div style={{
              fontSize: '13px',
              color: '#475569',
              lineHeight: 1.7,
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
            borderRadius: '18px',
            padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px' }}>💡</span>
              <strong style={{ fontSize: '12.5px', color: '#0369a1', letterSpacing: '0.2px' }}>
                วิธีปรับห้องนอนคืนนี้ (Actionable Recommendations)
              </strong>
            </div>
            <div style={{
              fontSize: '13px',
              color: '#475569',
              lineHeight: 1.7,
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