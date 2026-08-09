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

  // โครงสร้างปุ่มแบบ Inline Pill ที่ป้องกันโดน CSS ตัวอื่นดักทับ
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
          gap: 28px;
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
        {/* Header Bar */}
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

          <Link href="/account" style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f8fafc',
            textDecoration: 'none',
            fontSize: '20px',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)'
          }} title="เข้าสู่ระบบ / จัดการบัญชี">
            👤
          </Link>
        </header>

        {/* 4 True Pill Capsule Buttons (ใช้ Inline Style การันตีความโค้งมน 100%) */}
        <nav className="pill-grid">
          {navButtons.map((btn, idx) => (
            <Link key={idx} href={btn.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 24px',
              borderRadius: '9999px', // บังคับรูปทรงแคปซูลโค้งมน
              background: btn.bg,
              border: `1.5px solid ${btn.border}`,
              boxShadow: btn.glow,
              textDecoration: 'none',
              backdropFilter: 'blur(16px)',
              transition: 'transform 0.2s ease, filter 0.2s ease'
            }}>
              <span style={{ fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {btn.icon}
              </span>
              <div>
                <strong style={{ fontSize: '15px', display: 'block', color: '#ffffff', fontWeight: '800' }}>
                  {btn.title}
                </strong>
                <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '500' }}>
                  {btn.desc}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Hero Combined Sleep Score */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '20px'
        }}>
          <div style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0.8) 70%)',
            border: '2px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '28px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              borderRadius: '24px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '24px', marginBottom: '4px' }}>⌚</span>
              <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: '800', textTransform: 'uppercase' }}>GARMIN SCORE</span>
              <strong style={{ fontSize: '32px', fontWeight: '900', color: '#a855f7', margin: '4px 0' }}>
                {daily?.garminSleepScore ?? '--'}
              </strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนจากนาฬิกา</span>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              borderRadius: '24px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '24px', marginBottom: '4px' }}>🌿</span>
              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '800', textTransform: 'uppercase' }}>ROOM ENV SCORE</span>
              <strong style={{ fontSize: '32px', fontWeight: '900', color: '#34d399', margin: '4px 0' }}>
                {daily?.roomEnvironmentScore ?? '--'}
              </strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>คะแนนสภาพแวดล้อม</span>
            </div>
          </div>
        </section>

        {/* AI Diagnosis Banner */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(14, 116, 144, 0.25) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '28px',
          padding: '28px'
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