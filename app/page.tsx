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
    { href: '/sensors', icon: '🛏️', title: 'Comfy Room', desc: 'คุณภาพห้องนอน', border: '#bae6fd', badgeBg: '#f0f9ff' },
    { href: '/persona', icon: '⌚', title: 'Smart Watch', desc: 'Garmin Persona', border: '#e9d5ff', badgeBg: '#faf5ff' },
    { href: '/sensitivity', icon: '🎯', title: 'Sensitivity', desc: 'จุดอ่อนการนอน', border: '#fecdd3', badgeBg: '#fff1f2' },
    { href: '/sensitivity-profile', icon: '📜', title: 'ประวัติสะสม', desc: 'History Logs', border: '#fde68a', badgeBg: '#fffdf0' },
  ];

  return (
    <div className="page-wrapper">
      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          background-color: #f8fafc;
          background-image: radial-gradient(ellipse at 50% 0%, #e0f2fe 0%, #f8fafc 65%);
          color: #1e293b;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 24px 12px 48px 12px;
          display: flex;
          justify-content: center;
        }

        .app-container {
          width: 100%;
          max-width: 960px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .clean-card {
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid rgba(226, 232, 240, 0.85);
          box-shadow: 0 6px 20px -4px rgba(186, 230, 253, 0.25);
        }

        /* 1. Header Bar */
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px;
        }
        .brand-title {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.5px;
          line-height: 1.1;
        }
        .brand-sub {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* 2. Navigation Tabs Responsive */
        .clean-nav-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 16px;
          background-color: #ffffff;
          box-shadow: 0 2px 8px rgba(186, 230, 253, 0.15);
          text-decoration: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .nav-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(186, 230, 253, 0.25);
        }
        .nav-icon-badge {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }
        .nav-text-title {
          font-size: 12.5px;
          color: #1e293b;
          font-weight: 800;
          display: block;
          line-height: 1.2;
        }
        .nav-text-desc {
          font-size: 10.5px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* 3. Hero Score Section */
        .hero-score-card {
          padding: 28px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%);
        }
        .score-number {
          font-size: 64px;
          font-weight: 900;
          color: #0284c7;
          line-height: 1;
          letter-spacing: -2px;
        }
        .score-unit {
          font-size: 18px;
          color: #94a3b8;
          font-weight: 600;
        }
        .score-pill-title {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #ffffff;
          border: 1px solid #bae6fd;
          padding: 5px 14px;
          border-radius: 9999px;
          margin-bottom: 12px;
          box-shadow: 0 2px 6px rgba(186, 230, 253, 0.2);
          font-size: 11px;
          color: #0369a1;
          font-weight: 800;
          letter-spacing: 0.3px;
        }
        .score-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #15803d;
          font-weight: 700;
          margin-top: 12px;
          background-color: #f0fdf4;
          padding: 5px 16px;
          border-radius: 9999px;
          border: 1px solid #bbf7d0;
        }

        /* 4. Sub Scores Responsive */
        .sub-scores-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .sub-score-card {
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .sub-score-val {
          font-size: 28px;
          font-weight: 900;
          margin: 2px 0;
        }

        /* 5. AI Diagnosis Section */
        .ai-section {
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ai-header-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .ai-btn-analyze {
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #0284c7;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        /* ================= IPAD & TABLET (min-width: 640px) ================= */
        @media (min-width: 640px) {
          .page-wrapper {
            padding: 32px 20px 56px 20px;
          }
          .app-container {
            gap: 20px;
          }
          .clean-card {
            border-radius: 28px;
          }
          .brand-title {
            font-size: 22px;
          }
          .brand-sub {
            font-size: 12px;
          }
          .score-number {
            font-size: 76px;
          }
          .score-unit {
            font-size: 20px;
          }
          .sub-score-card {
            padding: 20px 16px;
          }
          .sub-score-val {
            font-size: 32px;
          }
          .ai-section {
            padding: 24px;
            gap: 16px;
          }
        }

        /* ================= DESKTOP / LAPTOP (min-width: 860px) ================= */
        @media (min-width: 860px) {
          .page-wrapper {
            padding: 40px 24px 64px 24px;
          }
          .clean-nav-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          .nav-item {
            padding: 12px 16px;
            border-radius: 18px;
          }
          .nav-icon-badge {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            font-size: 18px;
          }
          .nav-text-title {
            font-size: 13.5px;
          }
          .nav-text-desc {
            font-size: 11px;
          }
          .brand-title {
            font-size: 24px;
          }
          .hero-score-card {
            padding: 36px 24px;
          }
          .score-number {
            font-size: 84px;
          }
          .score-unit {
            font-size: 22px;
          }
          .sub-scores-grid {
            gap: 14px;
          }
          .sub-score-val {
            font-size: 34px;
          }
          .ai-section {
            padding: 28px;
          }
        }
      `}</style>

      <main className="app-container">
        {/* 1. Header Bar */}
        <header className="header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <div className="brand-title">
                <span style={{ color: '#f59e0b' }}>COM</span>
                <span style={{ color: '#60a5fa' }}>FLYYY</span>
                <span style={{ fontSize: '0.75em', fontWeight: '700', color: '#64748b', marginLeft: '6px' }}>SLEEP</span>
              </div>
              <span className="brand-sub">
                AI-Powered Personal Sleep Environment
              </span>
            </div>
          </div>

          <Link href="/account" style={{
            width: '40px',
            height: '40px',
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

        {/* 2. Navigation Tabs (Responsive Grid 2x2 บนมือถือ -> 1x4 บนคอม) */}
        <nav className="clean-nav-grid">
          {navTabs.map((tab, idx) => (
            <Link
              key={idx}
              href={tab.href}
              className="nav-item"
              style={{ border: `1.5px solid ${tab.border}` }}
            >
              <div className="nav-icon-badge" style={{ backgroundColor: tab.badgeBg }}>
                {tab.icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <strong className="nav-text-title">
                  {tab.title}
                </strong>
                <span className="nav-text-desc">
                  {tab.desc}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        {/* 3. Hero Score Section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="clean-card hero-score-card">
            <div className="score-pill-title">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
              <span>COMBINED SLEEP SCORE ({latestDate || '2026-08-16'})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '2px 0' }}>
              <span className="score-number">
                {combinedScoreDisplay}
              </span>
              <span className="score-unit">/ 100</span>
            </div>

            <div className="score-status-badge">
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
              คุณภาพการนอนหลับโดยรวมอยู่ในเกณฑ์ดี
            </div>
          </div>

          {/* Sub Scores แฝด (Garmin & Room Env) */}
          <div className="sub-scores-grid">
            <div className="clean-card sub-score-card">
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
              <strong className="sub-score-val" style={{ color: '#6d28d9' }}>
                {garminScoreDisplay ?? '--'}
              </strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนจากนาฬิกา</span>
            </div>

            <div className="clean-card sub-score-card">
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
              <strong className="sub-score-val" style={{ color: '#047857' }}>
                {roomScoreDisplay ?? '--'}
              </strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนสภาพแวดล้อม</span>
            </div>
          </div>
        </section>

        {/* 4. Gemini AI Diagnosis Card */}
        <section className="clean-card ai-section">
          <div className="ai-header-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                flexShrink: 0
              }}>
                ✨
              </div>
              <div>
                <strong style={{ fontSize: '14.5px', color: '#1e293b', fontWeight: '900', display: 'block', lineHeight: 1.2 }}>
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
              className="ai-btn-analyze"
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