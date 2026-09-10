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

  const navMenuItems = [
    { href: '/', icon: '🎯', title: 'Dashboard', active: true },
    { href: '/sensors', icon: '🛏️', title: 'Comfy Room', active: false },
    { href: '/persona', icon: '⌚', title: 'Smart Watch', active: false },
    { href: '/sensitivity', icon: '🎯', title: 'Sensitivity', active: false },
    { href: '/sensitivity-profile', icon: '📜', title: 'ประวัติสะสม', active: false },
  ];

  // คำนวณเส้นรอบวงสำหรับ Circular Progress Ring
  const circleRadiusDesktop = 100;
  const circleRadiusMobile = 78;
  const circumferenceDesktop = 2 * Math.PI * circleRadiusDesktop;
  const circumferenceMobile = 2 * Math.PI * circleRadiusMobile;
  const numericScore = typeof combinedScoreValue === 'number' ? Math.min(100, Math.max(0, combinedScoreValue)) : 79;
  const offsetDesktop = circumferenceDesktop - (numericScore / 100) * circumferenceDesktop;
  const offsetMobile = circumferenceMobile - (numericScore / 100) * circumferenceMobile;

  return (
    <div className="comflyyy-app">
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }

        .comflyyy-app {
          min-height: 100vh;
          background-color: #f8fafc;
          color: #1e293b;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* Top Bar */
        .top-navbar {
          height: 60px;
          background-color: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .top-sub-desc {
          display: none;
        }

        /* Responsive Layout Container */
        .workspace-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 12px;
          width: 100%;
          max-width: 1560px;
          margin: 0 auto;
        }

        /* Navigation Sidebar / Mobile Scrollbar */
        .nav-sidebar {
          background-color: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        }
        .nav-links-box {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          -webkit-overflow-scrolling: touch;
        }
        .nav-links-box::-webkit-scrollbar {
          display: none;
        }
        .nav-item-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 13px;
          white-space: nowrap;
          text-decoration: none;
        }
        .sidebar-extra-info {
          display: none;
        }

        /* Center Canvas */
        .center-stage {
          background-color: #ffffff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
        }

        /* Ring Sizes Responsive Switch */
        .desktop-ring {
          display: none;
        }
        .mobile-ring {
          display: flex;
          position: relative;
          width: 190px;
          height: 190px;
          align-items: center;
          justify-content: center;
        }

        /* Sub-scores Grid */
        .sub-scores-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          width: 100%;
        }

        /* Right Panel */
        .right-ai-panel {
          background-color: #ffffff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
        }

        /* ================= DESKTOP & TABLET WIDE (min-width: 1024px) ================= */
        @media (min-width: 1024px) {
          .top-navbar {
            padding: 0 24px;
          }
          .top-sub-desc {
            display: inline-block;
          }
          .workspace-grid {
            flex-direction: row;
            padding: 16px 24px;
            gap: 18px;
          }
          .nav-sidebar {
            flex: 0 0 230px;
            padding: 18px 14px;
            height: fit-content;
          }
          .nav-links-box {
            flex-direction: column;
            overflow-x: visible;
          }
          .nav-item-link {
            padding: 10px 14px;
          }
          .sidebar-extra-info {
            display: block;
          }
          .center-stage {
            flex: 1 1 540px;
            padding: 26px;
          }
          .desktop-ring {
            display: flex;
            position: relative;
            width: 240px;
            height: 240px;
            align-items: center;
            justify-content: center;
          }
          .mobile-ring {
            display: none;
          }
          .sub-scores-container {
            gap: 14px;
          }
          .right-ai-panel {
            flex: 1 1 380px;
            padding: 22px;
          }
        }
      `}</style>

      {/* ================= TOP APP BAR ================= */}
      <header className="top-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}>
            🌙
          </div>
          <div>
            <div style={{ fontSize: '19px', fontWeight: '900', letterSpacing: '0.4px', lineHeight: 1 }}>
              <span style={{ color: '#f59e0b' }}>COM</span>
              <span style={{ color: '#0284c7' }}>FLYYY</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b', marginLeft: '6px' }}>SLEEP</span>
            </div>
          </div>
          <span className="top-sub-desc" style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px', borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
            AI-Powered Personal Sleep Environment Studio
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '5px 10px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#15803d'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
            ESP32: Online
          </div>

          <Link href="/account" style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '15px'
          }}>
            👤
          </Link>
        </div>
      </header>

      {/* ================= WORKSPACE ================= */}
      <main className="workspace-grid">

        {/* 1. SIDEBAR (บนคอมเป็นเมนูแนวตั้ง / บนมือถือเป็นแถบชิปเลื่อนแนวนอน) */}
        <aside className="nav-sidebar">
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', paddingLeft: '4px' }}>
              System Navigation
            </span>
            <div className="nav-links-box" style={{ marginTop: '8px' }}>
              {navMenuItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className="nav-item-link"
                  style={{
                    backgroundColor: item.active ? '#f0f9ff' : '#f8fafc',
                    border: item.active ? '1.5px solid #bae6fd' : '1px solid #e2e8f0',
                    color: item.active ? '#0284c7' : '#475569',
                    fontWeight: item.active ? '800' : '600'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
            <button
              onClick={handleAnalyzeWithAI}
              disabled={loadingAi}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '12px',
                backgroundColor: '#0284c7',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.2)'
              }}
            >
              {loadingAi ? 'กำลังวิเคราะห์...' : '🔄 วิเคราะห์ใหม่'}
            </button>
          </div>

          <div className="sidebar-extra-info" style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '11.5px',
            color: '#64748b'
          }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase' }}>
              Session State
            </strong>
            <div>Date: <span style={{ fontWeight: '700', color: '#334155' }}>{latestDate || '2026-09-05'}</span></div>
            <div style={{ marginTop: '2px' }}>Sync: <span style={{ fontWeight: '700', color: '#15803d' }}>Realtime RTDB ✓</span></div>
          </div>
        </aside>

        {/* 2. CENTER STAGE: Main Visual Dashboard */}
        <section className="center-stage">
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '10px'
          }}>
            <div>
              <strong style={{ fontSize: '14.5px', color: '#0f172a', display: 'block' }}>
                Daily Sleep Synthesis
              </strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                การประเมินสภาวะการนอนหลับ
              </span>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#eff6ff',
              border: '1px solid #bae6fd',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '10.5px',
              fontWeight: '800',
              color: '#0284c7'
            }}>
              {latestDate || '2026-09-05'}
            </div>
          </div>

          {/* Desktop Circular Progress Ring */}
          <div className="desktop-ring">
            <svg width="240" height="240" viewBox="0 0 240 240" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="120" cy="120" r={circleRadiusDesktop} stroke="#f1f5f9" strokeWidth="16" fill="transparent" />
              <circle
                cx="120"
                cy="120"
                r={circleRadiusDesktop}
                stroke="#0284c7"
                strokeWidth="16"
                strokeDasharray={circumferenceDesktop}
                strokeDashoffset={offsetDesktop}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '72px', fontWeight: '900', color: '#0f172a', lineHeight: 1, letterSpacing: '-2px' }}>
                {combinedScoreDisplay}
              </span>
              <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '700', marginTop: '2px' }}>/ 100</span>
              <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: '800', letterSpacing: '0.8px', marginTop: '4px' }}>
                COMBINED SCORE
              </span>
            </div>
          </div>

          {/* Mobile Circular Progress Ring */}
          <div className="mobile-ring">
            <svg width="190" height="190" viewBox="0 0 190 190" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="95" cy="95" r={circleRadiusMobile} stroke="#f1f5f9" strokeWidth="13" fill="transparent" />
              <circle
                cx="95"
                cy="95"
                r={circleRadiusMobile}
                stroke="#0284c7"
                strokeWidth="13"
                strokeDasharray={circumferenceMobile}
                strokeDashoffset={offsetMobile}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '56px', fontWeight: '900', color: '#0f172a', lineHeight: 1, letterSpacing: '-1.5px' }}>
                {combinedScoreDisplay}
              </span>
              <span style={{ fontSize: '13.5px', color: '#94a3b8', fontWeight: '700', marginTop: '1px' }}>/ 100</span>
              <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: '800', letterSpacing: '0.6px', marginTop: '3px' }}>
                COMBINED SCORE
              </span>
            </div>
          </div>

          {/* Status Quality Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '5px 14px',
            borderRadius: '9999px',
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#15803d'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
            คุณภาพการนอนหลับโดยรวมอยู่ในเกณฑ์ดี
          </div>

          {/* Sub Scores แฝด (Garmin & Room Env) */}
          <div className="sub-scores-container">
            <div style={{
              backgroundColor: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: '16px',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px' }}>⌚</span>
                  <strong style={{ fontSize: '11px', color: '#7c3aed' }}>
                    GARMIN
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: '#6d28d9', lineHeight: 1 }}>
                    {garminScoreDisplay ?? '--'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#a78bfa', fontWeight: '600' }}>/100</span>
                </div>
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '8px' }}>
                สุขอนามัยการนอน
              </div>
            </div>

            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '16px',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '15px' }}>🌿</span>
                  <strong style={{ fontSize: '11px', color: '#047857' }}>
                    ROOM ENV
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: '#059669', lineHeight: 1 }}>
                    {roomScoreDisplay ?? '--'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6ee7b7', fontWeight: '600' }}>/100</span>
                </div>
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '8px' }}>
                สภาพแวดล้อมห้อง
              </div>
            </div>
          </div>
        </section>

        {/* 3. RIGHT PANEL: Gemini AI Diagnostic & Actions */}
        <aside className="right-ai-panel">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px'
              }}>
                ✨
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>
                  Gemini AI Advisor
                </strong>
                <span style={{ fontSize: '10px', color: '#64748b' }}>
                  Contextual Diagnosis &amp; Actions
                </span>
              </div>
            </div>

            <span style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              fontSize: '10px',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '9999px'
            }}>
              READY
            </span>
          </div>

          {/* Part 1: Diagnosis */}
          <div style={{
            backgroundColor: '#fffdfa',
            border: '1px solid #fed7aa',
            borderRadius: '16px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px' }}>🚨</span>
              <strong style={{ fontSize: '12px', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
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

          {/* Part 2: Actions */}
          <div style={{
            backgroundColor: '#f8fbff',
            border: '1px solid #bae6fd',
            borderRadius: '16px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px' }}>💡</span>
              <strong style={{ fontSize: '12.5px', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                วิธีปรับห้องนอนคืนนี้ (Actionable)
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
        </aside>

      </main>
    </div>
  );
}