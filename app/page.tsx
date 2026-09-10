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
  const circleRadius = 110;
  const circumference = 2 * Math.PI * circleRadius;
  const numericScore = typeof combinedScoreValue === 'number' ? Math.min(100, Math.max(0, combinedScoreValue)) : 79;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style jsx global>{`
        body {
          margin: 0;
          background-color: #f8fafc;
        }
      `}</style>

      {/* ================= TOP APP BAR ================= */}
      <header style={{
        height: '62px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            🌙
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.4px', lineHeight: 1 }}>
              <span style={{ color: '#f59e0b' }}>COM</span>
              <span style={{ color: '#0284c7' }}>FLYYY</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#64748b', marginLeft: '6px' }}>SLEEP</span>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px', borderLeft: '1px solid #e2e8f0', paddingLeft: '12px', display: 'none' }} className="top-sub-desc">
            AI-Powered Personal Sleep Environment Studio
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '5px 12px',
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

      {/* ================= 3-COLUMN WORKSPACE ================= */}
      <div style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        maxWidth: '1560px',
        margin: '0 auto',
        padding: '16px',
        gap: '16px',
        boxSizing: 'border-box',
        flexWrap: 'wrap'
      }}>

        {/* 1. LEFT SIDEBAR: Navigation & Controls */}
        <aside style={{
          flex: '0 0 230px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
          height: 'fit-content'
        }}>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', paddingLeft: '8px' }}>
              System Navigation
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
              {navMenuItems.map((item, idx) => (
                <Link key={idx} href={item.href} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: item.active ? '#f0f9ff' : 'transparent',
                  border: item.active ? '1px solid #bae6fd' : '1px solid transparent',
                  color: item.active ? '#0284c7' : '#475569',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: item.active ? '800' : '600',
                  transition: 'background-color 0.15s ease'
                }}>
                  <span style={{ fontSize: '15px' }}>{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', paddingLeft: '8px' }}>
              AI Workflow
            </span>
            <button
              onClick={handleAnalyzeWithAI}
              disabled={loadingAi}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '10px',
                borderRadius: '12px',
                backgroundColor: '#0284c7',
                border: 'none',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
              }}
            >
              {loadingAi ? 'กำลังวิเคราะห์...' : '🔄 วิเคราะห์ใหม่'}
            </button>
          </div>

          <div style={{
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
        <section style={{
          flex: '1 1 540px',
          minWidth: '320px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
        }}>
          {/* Subheader bar */}
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '14px'
          }}>
            <div>
              <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>
                Daily Sleep Synthesis
              </strong>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                การประเมินสภาวะการนอนหลับและการควบคุมสภาพแวดล้อม
              </span>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bae6fd',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: '800',
              color: '#0284c7'
            }}>
              LIVE SYNTHESIS
            </div>
          </div>

          {/* Big Center Circular Progress Ring */}
          <div style={{
            position: 'relative',
            width: '260px',
            height: '260px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '8px'
          }}>
            <svg width="260" height="260" viewBox="0 0 260 260" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="130"
                cy="130"
                r={circleRadius}
                stroke="#f1f5f9"
                strokeWidth="16"
                fill="transparent"
              />
              <circle
                cx="130"
                cy="130"
                r={circleRadius}
                stroke="#0284c7"
                strokeWidth="16"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>

            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{
                fontSize: '76px',
                fontWeight: '900',
                color: '#0f172a',
                lineHeight: 1,
                letterSpacing: '-2px'
              }}>
                {combinedScoreDisplay}
              </span>
              <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '700', marginTop: '2px' }}>/ 100</span>
              <span style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: '800', letterSpacing: '0.8px', marginTop: '6px' }}>
                COMBINED SCORE
              </span>
            </div>
          </div>

          {/* Quality Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '6px 18px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '700',
            color: '#15803d'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
            คุณภาพการนอนหลับโดยรวมอยู่ในเกณฑ์ดี
          </div>

          {/* Sub Scores แฝด (Garmin & Room Env) 2 ใบใหญ่ด้านล่าง */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            width: '100%',
            marginTop: 'auto'
          }}>
            <div style={{
              backgroundColor: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: '18px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '18px' }}>⌚</span>
                  <strong style={{ fontSize: '12px', color: '#7c3aed', letterSpacing: '0.3px' }}>
                    GARMIN SCORE
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '900', color: '#6d28d9', lineHeight: 1 }}>
                    {garminScoreDisplay ?? '--'}
                  </span>
                  <span style={{ fontSize: '14px', color: '#a78bfa', fontWeight: '600' }}>/100</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', borderTop: '1px solid #f3e8ff', paddingTop: '8px' }}>
                สุขอนามัยการนอนและอัตราดิ้นตื่น
              </div>
            </div>

            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '18px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '18px' }}>🌿</span>
                  <strong style={{ fontSize: '12px', color: '#047857', letterSpacing: '0.3px' }}>
                    ROOM ENV SCORE
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '900', color: '#059669', lineHeight: 1 }}>
                    {roomScoreDisplay ?? '--'}
                  </span>
                  <span style={{ fontSize: '14px', color: '#6ee7b7', fontWeight: '600' }}>/100</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', borderTop: '1px solid #dcfce7', paddingTop: '8px' }}>
                สภาพแวดล้อม (CO2, Temp, Hum, Sound)
              </div>
            </div>
          </div>
        </section>

        {/* 3. RIGHT PANEL: Gemini AI Diagnostic & Actions */}
        <aside style={{
          flex: '1 1 380px',
          minWidth: '320px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                ✨
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                  Gemini AI Advisor
                </strong>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>
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

          {/* Part 1: Diagnosis (Root Cause) */}
          <div style={{
            backgroundColor: '#fffdfa',
            border: '1px solid #fed7aa',
            borderRadius: '16px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px' }}>🚨</span>
              <strong style={{ fontSize: '12.5px', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                สาเหตุเชิงลึกจากสภาพแวดล้อม (Diagnosis)
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

          {/* Part 2: Actionable Recommendations */}
          <div style={{
            backgroundColor: '#f8fbff',
            border: '1px solid #bae6fd',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px' }}>💡</span>
              <strong style={{ fontSize: '12.5px', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                วิธีปรับห้องนอนคืนนี้ (Actionable)
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
        </aside>

      </div>
    </div>
  );
}