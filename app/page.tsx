'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function HomePage() {
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    if (!database) return;

    const processAutoSync = async () => {
      try {
        const garminRes = await fetch('/api/garmin?latest=true').catch(() => null);
        const garminJson = garminRes ? await garminRes.json() : null;
        const garmin = garminJson?.data;

        if (!garmin || !garmin.garminSleepScore) return;

        const sleepStart = Number(garmin.sleepStartTimestamp);
        const sleepEnd = Number(garmin.sleepEndTimestamp);

        const logsRef = ref(database, 'logs');
        onValue(logsRef, async (snapshot) => {
          if (!snapshot.exists()) return;

          const rawLogs = snapshot.val();
          const logKeys = Object.keys(rawLogs);

          const matchedSleepLogs = logKeys.map(k => rawLogs[k]).filter((log: any) => {
            let t = Number(log.timestamp) || 0;
            if (t < 1000000000000) t = t * 1000;
            return t >= sleepStart && t <= sleepEnd;
          });

          const effectiveLogs = matchedSleepLogs.length > 0 ? matchedSleepLogs : logKeys.slice(-30).map(k => rawLogs[k]);
          const totalLogs = effectiveLogs.length || 1;

          const avgs = {
            temp: effectiveLogs.reduce((s, i) => s + (Number(i.temperature) || 26.5), 0) / totalLogs,
            hum: effectiveLogs.reduce((s, i) => s + (Number(i.humidity) || 52), 0) / totalLogs,
            sound: effectiveLogs.reduce((s, i) => s + (Number(i.sound) || 28), 0) / totalLogs,
            light: effectiveLogs.reduce((s, i) => s + (Number(i.light_lux) || 0), 0) / totalLogs,
            co2: effectiveLogs.reduce((s, i) => s + (Number(i.co2) || 650), 0) / totalLogs,
            pm25: effectiveLogs.reduce((s, i) => s + (Number(i.pm25) || 8), 0) / totalLogs
          };

          const geminiRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensorAverages: avgs, restlessCount: garmin.restlessMomentsCount || 0 })
          }).catch(() => null);

          const geminiJson = geminiRes ? await geminiRes.json() : null;
          const aiData = geminiJson?.data;
          const weights = aiData?.weights || { co2: 0.2, temp: 0.25, hum: 0.15, pm25: 0.1, sound: 0.2, light: 0.1 };

          const co2Score = Math.max(0, 100 - (avgs.co2 > 1000 ? (avgs.co2 - 1000) * 0.1 : 0));
          const tempScore = Math.max(0, 100 - (avgs.temp > 25 ? (avgs.temp - 25) * 10 : (23 - avgs.temp) * 10));
          const humScore = Math.max(0, 100 - (avgs.hum > 60 ? (avgs.hum - 60) * 3 : 0));
          const pm25Score = Math.max(0, 100 - (avgs.pm25 > 37.5 ? (avgs.pm25 - 37.5) * 2 : 0));
          const soundScore = avgs.sound > 1000 ? 50 : 100;
          const lightScore = avgs.light > 10 ? 70 : 100;

          const roomEnviScore = Math.round(
            (co2Score * weights.co2) +
            (tempScore * weights.temp) +
            (humScore * weights.hum) +
            (pm25Score * weights.pm25) +
            (soundScore * weights.sound) +
            (lightScore * weights.light)
          );

          const combinedSleepScore = Math.round((garmin.garminSleepScore + roomEnviScore) / 2);

          const summaryRef = ref(database, 'personal_sensitivity/summary');
          set(summaryRef, {
            evaluatedDate: garmin.calendarDate,
            dailyMetrics: {
              garminSleepScore: garmin.garminSleepScore,
              roomEnvironmentScore: roomEnviScore,
              combinedSleepScore: combinedSleepScore,
              restlessMoments: garmin.restlessMomentsCount || 0
            },
            aiInsight: {
              weights,
              diagnosis: aiData?.diagnosis,
              recommendation: aiData?.recommendation
            }
          });
        }, { onlyOnce: true });
      } catch (e) {
        console.error('Process Error:', e);
      }
    };

    processAutoSync();
  }, []);

  useEffect(() => {
    if (!database) return;
    const summaryRef = ref(database, 'personal_sensitivity/summary');
    onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) setSummaryData(snapshot.val());
    });
  }, []);

  const daily = summaryData?.dailyMetrics;
  const aiInsight = summaryData?.aiInsight;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.22) 0%, transparent 70%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px 16px 48px 16px',
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
          padding: 8px 4px;
        }

        .brand-box {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .brand-logo {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
        }

        .account-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(56, 189, 248, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f8fafc;
          text-decoration: none;
          font-size: 20px;
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.25);
          transition: all 0.25s ease;
        }

        .account-btn:hover {
          transform: scale(1.08);
          border-color: #38bdf8;
          box-shadow: 0 0 24px rgba(56, 189, 248, 0.5);
        }

        /* Large Interactive Buttons Grid */
        .nav-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .nav-card-btn {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 16px 20px;
          text-decoration: none;
          color: #f8fafc;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .nav-card-btn:hover {
          background: rgba(30, 41, 59, 0.85);
          border-color: rgba(56, 189, 248, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(56, 189, 248, 0.2);
        }

        .nav-icon {
          font-size: 22px;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.7);
        }

        /* Combined Score Hero Layout */
        .score-hero-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .score-main-circle {
          background: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0.8) 70%);
          border: 2px solid rgba(56, 189, 248, 0.4);
          border-radius: 24px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(56, 189, 248, 0.15);
          text-align: center;
        }

        .score-sub-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .score-sub-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        @media (min-width: 768px) {
          .nav-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .score-hero-container {
            grid-template-columns: 1.2fr 1fr;
          }
        }
      `}</style>

      <main className="app-container">
        {/* Header Bar */}
        <header className="header-bar">
          <div className="brand-box">
            <div className="brand-logo">🌙</div>
            <div>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#f8fafc', letterSpacing: '0.5px', display: 'block' }}>
                COMFY SLEEP
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                AI-Powered Personal Sleep Environment
              </span>
            </div>
          </div>

          <Link href="/account" className="account-btn" title="เข้าสู่ระบบ / จัดการบัญชี">
            👤
          </Link>
        </header>

        {/* Big Interactive Navigation Buttons */}
        <nav className="nav-grid">
          <Link href="/sensors" className="nav-card-btn">
            <div className="nav-icon">🛏️</div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block', color: '#f8fafc' }}>Comfy Room</strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>คุณภาพห้องนอน</span>
            </div>
          </Link>

          <Link href="/persona" className="nav-card-btn">
            <div className="nav-icon">⌚</div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block', color: '#f8fafc' }}>Smart Watch</strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Garmin Persona</span>
            </div>
          </Link>

          <Link href="/sensitivity" className="nav-card-btn">
            <div className="nav-icon">🎯</div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block', color: '#f8fafc' }}>Sensitivity</strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>จุดอ่อนการนอน</span>
            </div>
          </Link>

          <Link href="/sensitivity-profile" className="nav-card-btn">
            <div className="nav-icon">📜</div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block', color: '#f8fafc' }}>ประวัติสะสม</strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>History Logs</span>
            </div>
          </Link>
        </nav>

        {/* Combined Score Hero Section */}
        <section className="score-hero-container">
          {/* Main Hero Circle Score */}
          <div className="score-main-circle">
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              🎯 COMBINED SLEEP SCORE
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '64px', fontWeight: '900', color: '#38bdf8', lineHeight: 1 }}>
                {daily?.combinedSleepScore ?? '--'}
              </span>
              <span style={{ fontSize: '20px', color: '#64748b', fontWeight: '700' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '13px', color: '#34d399', fontWeight: '700', marginTop: '12px', backgroundColor: 'rgba(52, 211, 153, 0.12)', padding: '6px 16px', borderRadius: '9999px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              🟢 คุณภาพการนอนหลับโดยรวมอยู่ในเกณฑ์ดี
            </span>
          </div>

          {/* Separate Sub-scores Cards */}
          <div className="score-sub-grid">
            <div className="score-sub-card" style={{ borderColor: 'rgba(99, 102, 241, 0.3)' }}>
              <span style={{ fontSize: '24px', marginBottom: '4px' }}>⌚</span>
              <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: '800', textTransform: 'uppercase' }}>GARMIN SCORE</span>
              <strong style={{ fontSize: '32px', fontWeight: '900', color: '#a855f7', margin: '4px 0' }}>
                {daily?.garminSleepScore ?? '--'}
              </strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนจากนาฬิกา</span>
            </div>

            <div className="score-sub-card" style={{ borderColor: 'rgba(52, 211, 153, 0.3)' }}>
              <span style={{ fontSize: '24px', marginBottom: '4px' }}>🌿</span>
              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '800', textTransform: 'uppercase' }}>ROOM ENV SCORE</span>
              <strong style={{ fontSize: '32px', fontWeight: '900', color: '#34d399', margin: '4px 0' }}>
                {daily?.roomEnvironmentScore ?? '--'}
              </strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนสภาพแวดล้อม</span>
            </div>
          </div>
        </section>

        {/* AI Recommendation Banner (ใหญ่ขึ้น เด่นขึ้น) */}
        <section className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(14, 116, 144, 0.25) 100%)',
          borderColor: 'rgba(56, 189, 248, 0.4)',
          boxShadow: '0 0 30px rgba(56, 189, 248, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: '900', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              ผลวิเคราะห์สาเหตุและคำแนะนำจาก AI (GEMINI DIAGNOSIS)
            </span>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', margin: 0, lineHeight: 1.6 }}>
            {aiInsight?.diagnosis || "กำลังประมวลผลวิเคราะห์สาเหตุเชิงลึก..."}
          </h2>

          <div style={{
            marginTop: '12px',
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            <p style={{ fontSize: '14px', color: '#e2e8f0', margin: 0, lineHeight: 1.7 }}>
              💡 <strong style={{ color: '#38bdf8' }}>คำแนะนำจาก AI:</strong> {aiInsight?.recommendation || "กำลังประมวลผลคำแนะนำ..."}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}