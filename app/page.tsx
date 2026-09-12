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

  // คำนวณ Room Score ตามสูตรจริง[cite: 2]
  const calculateDynamicRoomScore = (data: any) => {
    if (!data) return null;
    let score = 100;

    const co2 = Number(data.co2 || 0);
    if (co2 > 1000) score -= Math.min(30, Math.round((co2 - 1000) / 30));

    const temp = Number(data.temperature || data.temp || 0);
    if (temp > 0) {
      if (temp < 23) score -= Math.min(20, Math.round((23 - temp) * 5));
      else if (temp > 25) score -= Math.min(20, Math.round((temp - 25) * 5));
    }

    const hum = Number(data.humidity || data.hum || 0);
    if (hum > 0) {
      if (hum < 50) score -= Math.min(15, Math.round((50 - hum) * 1.5));
      else if (hum > 60) score -= Math.min(15, Math.round((hum - 60) * 1.5));
    }

    const sound = Number(data.sound || data.sound_db || 0);
    if (sound > 60) score -= Math.min(20, 15);

    return Math.max(20, Math.min(100, score));
  };

  useEffect(() => {
    if (!database) return;

    const historyRef = ref(database, 'personal_sensitivity/history');
    const unsubHistory = onValue(historyRef, (snapshot) => {
      let targetDate = '2026-09-05';

      if (snapshot.exists()) {
        const val = snapshot.val();
        const dates = Object.keys(val).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        if (dates.length > 0) {
          targetDate = dates[0];
          setLatestData(val[targetDate]);
        }
      }
      setLatestDate(targetDate);

      const garminRef = ref(database, `garmin_sleep/${targetDate}`);
      onValue(garminRef, (gSnap) => {
        if (gSnap.exists()) setGarminData(gSnap.val());
      });

      const roomRef = ref(database, `room_env/${targetDate}`);
      onValue(roomRef, (rSnap) => {
        if (rSnap.exists()) setRoomData(rSnap.val());
      });

      const eventRef = ref(database, `personal_sensitivity/all_sensors_events/${targetDate}`);
      onValue(eventRef, (eSnap) => {
        if (eSnap.exists()) setEventData(eSnap.val());
      });

      const summaryRef = ref(database, 'personal_sensitivity/summary');
      onValue(summaryRef, (sumSnap) => {
        if (sumSnap.exists() && sumSnap.val()?.aiInsight) {
          setAiInsight(sumSnap.val().aiInsight);
        }
      });
    });

    return () => unsubHistory();
  }, []);

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

  // คุมธีมขาว-น้ำเงิน เรียบง่าย ไม่ใช้สีลูกกวาด
  const navTabs = [
    { href: '/sensors', icon: '🛏️', title: 'Comfy Room', desc: 'คุณภาพห้องนอน' },
    { href: '/persona', icon: '⌚', title: 'Smart Watch', desc: 'Garmin Persona' },
    { href: '/sensitivity', icon: '🎯', title: 'Sensitivity', desc: 'จุดอ่อนการนอน' },
    { href: '/sensitivity-profile', icon: '📜', title: 'ประวัติสะสม', desc: 'History Logs' },
  ];

  // คำนวณ Circular Ring
  const circleRadius = 72;
  const circumference = 2 * Math.PI * circleRadius;
  const numericScore = typeof combinedScoreValue === 'number' ? Math.min(100, Math.max(0, combinedScoreValue)) : 79;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px 14px 48px 14px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <main style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>

        {/* 1. Header Bar เรียบหรู ขาว-น้ำเงิน */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 2px'
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              <span style={{ color: '#1d4ed8' }}>COMFLYYY</span>
              <span style={{ color: '#0f172a', marginLeft: '6px' }}>SLEEP</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
              AI-Powered Personal Sleep Environment
            </span>
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
            color: '#1d4ed8',
            textDecoration: 'none',
            fontSize: '15px'
          }}>
            👤
          </Link>
        </header>

        {/* 2. Navigation 4 ปุ่ม: สีขาวคลีน คุมโทนน้ำเงิน ไม่มีสีแฟนซี */}
        <nav style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px'
        }}>
          {navTabs.map((tab, idx) => (
            <Link key={idx} href={tab.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '17px',
                flexShrink: 0
              }}>
                {tab.icon}
              </div>
              <div>
                <strong style={{
                  fontSize: '13px',
                  color: '#0f172a',
                  fontWeight: '700',
                  display: 'block',
                  lineHeight: 1.2
                }}>
                  {tab.title}
                </strong>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                  {tab.desc}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        {/* 3. Combined Score Card: สีขาวล้วน ไม่ไล่เฉด */}
        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '24px 16px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          {/* Badge วันที่ขนาดกะทัดรัด */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#eff6ff',
            padding: '4px 12px',
            borderRadius: '9999px',
            marginBottom: '16px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1d4ed8' }}></span>
            <span style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '700' }}>
              COMBINED SLEEP SCORE • {latestDate || '2026-09-05'}
            </span>
          </div>

          {/* Circular Progress Ring สไตล์ Minimal Blue */}
          <div style={{ position: 'relative', width: '164px', height: '164px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="164" height="164" viewBox="0 0 164 164" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="82"
                cy="82"
                r={circleRadius}
                stroke="#f1f5f9"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="82"
                cy="82"
                r={circleRadius}
                stroke="#1d4ed8"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>

            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{
                  fontSize: '52px',
                  fontWeight: '900',
                  color: '#0f172a',
                  lineHeight: 1,
                  letterSpacing: '-1.5px'
                }}>
                  {combinedScoreDisplay}
                </span>
                <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '600' }}>/100</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>
                ภาพรวมคืนนี้
              </span>
            </div>
          </div>

          {/* สถานะผลการนอน */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#059669',
            fontWeight: '600',
            marginTop: '16px',
            backgroundColor: '#f0fdf4',
            padding: '5px 14px',
            borderRadius: '9999px',
            border: '1px solid #dcfce7'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            คุณภาพการนอนหลับโดยรวมอยู่ในเกณฑ์ดี
          </div>
        </section>

        {/* 4. Sub Scores คู่ (Garmin & Room Env) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '18px', marginBottom: '2px' }}>⌚</span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>GARMIN SCORE</span>
            <strong style={{ fontSize: '28px', fontWeight: '900', color: '#1d4ed8', margin: '2px 0' }}>
              {garminScoreDisplay ?? '--'}
            </strong>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>คะแนนจากนาฬิกา</span>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '18px', marginBottom: '2px' }}>🌿</span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>ROOM ENV SCORE</span>
            <strong style={{ fontSize: '28px', fontWeight: '900', color: '#059669', margin: '2px 0' }}>
              {roomScoreDisplay ?? '--'}
            </strong>
            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>คะแนนสภาพแวดล้อม</span>
          </div>
        </div>

        {/* 5. AI Diagnosis Card เรียบง่าย ไม่ฉูดฉาด */}
        <section style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div>
              <strong style={{ fontSize: '14px', color: '#0f172a', fontWeight: '800', display: 'block' }}>
                ผลวิเคราะห์และคำแนะนำจาก AI
              </strong>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                GEMINI SLEEP COACH
              </span>
            </div>

            <button
              onClick={handleAnalyzeWithAI}
              disabled={loadingAi}
              style={{
                backgroundColor: '#1d4ed8',
                border: 'none',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: '600',
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
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px' }}>🚨</span>
              <strong style={{ fontSize: '12px', color: '#0f172a' }}>
                สาเหตุเชิงลึกจากสภาพแวดล้อมจริง (Diagnosis)
              </strong>
            </div>
            <div style={{
              fontSize: '12.5px',
              color: '#475569',
              lineHeight: 1.7,
              whiteSpace: 'pre-line'
            }}>
              {aiInsight?.diagnosis || "ระบบกำลังเชื่อมโยงปัจจัยสภาพแวดล้อมเพื่อสรุปสาเหตุ..."}
            </div>
          </div>

          {/* Sub Card 2: Actionable Recommendations */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px' }}>💡</span>
              <strong style={{ fontSize: '12px', color: '#0f172a' }}>
                วิธีปรับห้องนอนคืนนี้ (Actionable Recommendations)
              </strong>
            </div>
            <div style={{
              fontSize: '12.5px',
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