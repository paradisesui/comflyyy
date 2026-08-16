'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function HomePage() {
  const [latestData, setLatestData] = useState<any>(null);
  const [garminData, setGarminData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [syncingGarmin, setSyncingGarmin] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  useEffect(() => {
    if (!database) return;

    const historyRef = ref(database, 'personal_sensitivity/history');
    const unsubHistory = onValue(historyRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const dates = Object.keys(val).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        if (dates.length > 0) {
          const newestDateKey = dates[0];
          const newestItem = val[newestDateKey];
          setLatestData(newestItem);

          const garminRef = ref(database, `garmin_sleep/${newestDateKey}`);
          onValue(garminRef, (gSnap) => {
            if (gSnap.exists()) setGarminData(gSnap.val());
          }, { onlyOnce: true });

          const roomRef = ref(database, `room_env/${newestDateKey}`);
          onValue(roomRef, (rSnap) => {
            if (rSnap.exists()) setRoomData(rSnap.val());
          }, { onlyOnce: true });

          const eventRef = ref(database, `personal_sensitivity/all_sensors_events/${newestDateKey}`);
          onValue(eventRef, (eSnap) => {
            if (eSnap.exists()) setEventData(eSnap.val());
          }, { onlyOnce: true });

          const summaryRef = ref(database, 'personal_sensitivity/summary');
          onValue(summaryRef, (sumSnap) => {
            if (sumSnap.exists() && sumSnap.val()?.aiInsight) {
              setAiInsight(sumSnap.val().aiInsight);
            }
          }, { onlyOnce: true });
        }
      }
    });

    return () => unsubHistory();
  }, []);

  // ฟังก์ชันกดปุ่ม Sync Garmin เข้า Firebase ทันที
  const handleSyncGarmin = async () => {
    setSyncingGarmin(true);
    setSyncMessage('');

    try {
      const res = await fetch('/api/garmin-sync', { method: 'POST' });
      const json = await res.json();

      if (json.success) {
        setSyncMessage('✅ อัปเดตข้อมูล Garmin สำเร็จ!');
        setTimeout(() => setSyncMessage(''), 4000);
      } else {
        setSyncMessage('❌ อัปเดตล้มเหลว กรุณาลองใหม่');
      }
    } catch (err) {
      console.error('Sync request failed:', err);
      setSyncMessage('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSyncingGarmin(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!latestData?.date) return;
    setLoadingAi(true);

    try {
      const payload = {
        date: latestData.date,
        sensorAverages: roomData || { co2: 850, temp: 25.4, hum: 58, pm25: 0, sound: 38, light: 0 },
        garminData: garminData || {
          garminSleepScore: latestData.garminScore || 65,
          restlessMomentsCount: latestData.restlessCount || 19,
          durationInSeconds: 19080,
          avgSleepStress: 15,
          deepSleepDurationInSeconds: 4920,
          remSleepDurationInSeconds: 4500,
          lightSleepDurationInSeconds: 9660
        },
        sensitivityProfile: {
          sensitivityScore: eventData?.overallSensitivityScore || 38,
          triggerBreakdown: eventData?.sensorTriggerBreakdown || { sound_db: 7, humidity: 6, co2: 4, temperature: 2 }
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

  const navButtons = [
    { href: '/sensors', icon: '🛏️', title: 'Comfy Room', desc: 'คุณภาพห้องนอน', bg: 'linear-gradient(135deg, rgba(14, 116, 144, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%)', border: 'rgba(56, 189, 248, 0.6)', glow: '0 8px 24px rgba(56, 189, 248, 0.3)' },
    { href: '/persona', icon: '⌚', title: 'Smart Watch', desc: 'Garmin Persona', bg: 'linear-gradient(135deg, rgba(88, 28, 135, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%)', border: 'rgba(168, 85, 247, 0.6)', glow: '0 8px 24px rgba(168, 85, 247, 0.3)' },
    { href: '/sensitivity', icon: '🎯', title: 'Sensitivity', desc: 'จุดอ่อนการนอน', bg: 'linear-gradient(135deg, rgba(159, 18, 57, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%)', border: 'rgba(244, 63, 94, 0.6)', glow: '0 8px 24px rgba(244, 63, 94, 0.3)' },
    { href: '/sensitivity-profile', icon: '📜', title: 'ประวัติสะสม', desc: 'History Logs', bg: 'linear-gradient(135deg, rgba(20, 83, 45, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%)', border: 'rgba(52, 211, 153, 0.6)', glow: '0 8px 24px rgba(52, 211, 153, 0.3)' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '32px 16px 48px 16px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .app-container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pill-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        @media (min-width: 768px) {
          .pill-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>

      <main className="app-container">
        {/* Header with Garmin Sync Button */}
        <header className="header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)'
            }}>
              🌙
            </div>
            <div>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#f8fafc', display: 'block' }}>
                COMFY SLEEP
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                AI-Powered Personal Sleep Environment
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* ปุ่ม Sync Garmin */}
            <button
              onClick={handleSyncGarmin}
              disabled={syncingGarmin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(99, 102, 241, 0.5) 100%)',
                border: '1.5px solid rgba(168, 85, 247, 0.6)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '800',
                cursor: syncingGarmin ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 14px rgba(168, 85, 247, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{syncingGarmin ? '⏳' : '⌚'}</span>
              <span>{syncingGarmin ? 'กำลังดึง Garmin...' : 'Sync Garmin'}</span>
            </button>

            <Link href="/account" style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f8fafc',
              textDecoration: 'none',
              fontSize: '18px'
            }}>
              👤
            </Link>
          </div>
        </header>

        {syncMessage && (
          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: '700',
            color: syncMessage.includes('✅') ? '#34d399' : '#f43f5e',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            padding: '8px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            {syncMessage}
          </div>
        )}

        {/* 4 Navigation Buttons */}
        <nav className="pill-grid">
          {navButtons.map((btn, idx) => (
            <Link key={idx} href={btn.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 24px',
              borderRadius: '9999px',
              background: btn.bg,
              border: `1.5px solid ${btn.border}`,
              boxShadow: btn.glow,
              textDecoration: 'none',
              backdropFilter: 'blur(16px)'
            }}>
              <span style={{ fontSize: '24px' }}>{btn.icon}</span>
              <div>
                <strong style={{ fontSize: '15px', display: 'block', color: '#ffffff', fontWeight: '800' }}>
                  {btn.title}
                </strong>
                <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                  {btn.desc}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Hero Score */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          <div style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0.8) 70%)',
            border: '2px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '28px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              🎯 COMBINED SLEEP SCORE ({latestData?.date || 'กำลังโหลด...'})
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '60px', fontWeight: '900', color: '#38bdf8', lineHeight: 1 }}>
                {latestData?.combinedScore ?? '--'}
              </span>
              <span style={{ fontSize: '20px', color: '#64748b', fontWeight: '700' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '13px', color: '#34d399', fontWeight: '700', marginTop: '10px', backgroundColor: 'rgba(52, 211, 153, 0.12)', padding: '6px 16px', borderRadius: '9999px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              🟢 คุณภาพการนอนหลับโดยรวมอยู่ในเกณฑ์ดี
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '24px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '24px', marginBottom: '4px' }}>⌚</span>
              <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: '800' }}>GARMIN SCORE</span>
              <strong style={{ fontSize: '30px', fontWeight: '900', color: '#a855f7', margin: '4px 0' }}>
                {latestData?.garminScore ?? '--'}
              </strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนจากนาฬิกา</span>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              borderRadius: '24px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '24px', marginBottom: '4px' }}>🌿</span>
              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '800' }}>ROOM ENV SCORE</span>
              <strong style={{ fontSize: '30px', fontWeight: '900', color: '#34d399', margin: '4px 0' }}>
                {latestData?.roomScore ?? '--'}
              </strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนสภาพแวดล้อม</span>
            </div>
          </div>
        </section>

        {/* Gemini AI Diagnosis Card */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(14, 116, 144, 0.25) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '28px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🤖</span>
              <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: '900', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                ผลวิเคราะห์และคำแนะนำจาก AI (GEMINI COACH)
              </span>
            </div>
            <button
              onClick={handleAnalyzeWithAI}
              disabled={loadingAi}
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                padding: '6px 16px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {loadingAi ? 'กำลังวิเคราะห์...' : '🔄 วิเคราะห์ใหม่'}
            </button>
          </div>

          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '18px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>🚨</span>
              <strong style={{ fontSize: '13px', color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                สาเหตุเชิงลึกจากสภาพแวดล้อมจริง (Diagnosis)
              </strong>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#f8fafc',
              lineHeight: 1.8,
              fontWeight: '500',
              whiteSpace: 'pre-line'
            }}>
              {aiInsight?.diagnosis || "ระบบกำลังเชื่อมโยงปัจจัยสภาพแวดล้อมเพื่อสรุปสาเหตุ..."}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '18px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>💡</span>
              <strong style={{ fontSize: '13px', color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                วิธีปรับห้องนอนคืนนี้ (Actionable Recommendations)
              </strong>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#fef08a',
              lineHeight: 1.8,
              whiteSpace: 'pre-line'
            }}>
              {aiInsight?.recommendation || "1. รักษาการถ่ายเทอากาศในห้องนอน\n2. ตั้งอุณหภูมิแอร์ที่ 24-25°C"}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}