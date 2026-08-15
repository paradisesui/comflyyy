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
        const garminRef = ref(database, 'garmin_sleep');
        const logsRef = ref(database, 'logs');

        onValue(garminRef, (garminSnapshot) => {
          if (!garminSnapshot.exists()) return;

          const garminData = garminSnapshot.val();
          const garminDates = Object.keys(garminData);

          onValue(logsRef, async (logsSnapshot) => {
            const rawLogs = logsSnapshot.exists() ? logsSnapshot.val() : {};
            const logKeys = Object.keys(rawLogs);

            let latestRoomEnvScore = 70;
            let latestCombinedScore = 75;
            let latestAiData: any = null;
            let latestDate = '';

            // เรียงลำดับวันที่จากใหม่สุดไปเก่าสุด
            const sortedDates = [...garminDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

            for (const dateKey of sortedDates) {
              const garmin = garminData[dateKey];
              if (!garmin || !garmin.garminSleepScore) continue;

              const targetDate = garmin.calendarDate || dateKey;
              const standardDateKey = targetDate.includes('-')
                ? targetDate
                : `${targetDate.slice(0, 4)}-${targetDate.slice(4, 6)}-${targetDate.slice(6, 8)}`;

              let sleepStart = Number(garmin.sleepStartTimestamp) || 0;
              let sleepEnd = Number(garmin.sleepEndTimestamp) || 0;

              if (sleepStart < 1000000000000) sleepStart *= 1000;
              if (sleepEnd < 1000000000000) sleepEnd *= 1000;

              // 1. ตรวจสอบการ Match ของ Timestamp แบบนาทีต่อนาที
              const matchedLogs = logKeys.map(k => rawLogs[k]).filter((log: any) => {
                let t = Number(log.timestamp) || 0;
                if (t < 1000000000000) t *= 1000;
                return t >= sleepStart && t <= sleepEnd;
              });

              const isTimestampMatched = matchedLogs.length > 0;

              // กรณีไม่ Match ให้ใช้ Fallback สำหรับแสดงผลหน้าแรกเพื่อไม่ให้ค้าง
              const effectiveLogs = isTimestampMatched
                ? matchedLogs
                : logKeys.slice(-30).map(k => rawLogs[k]);

              const total = effectiveLogs.length || 1;

              const avgs = {
                temp: effectiveLogs.reduce((s, i) => s + (Number(i.temperature) || 26.0), 0) / total,
                hum: effectiveLogs.reduce((s, i) => s + (Number(i.humidity) || 55.0), 0) / total,
                sound: effectiveLogs.reduce((s, i) => s + (Number(i.sound) || 30.0), 0) / total,
                light: effectiveLogs.reduce((s, i) => s + (Number(i.light_lux || i.lux) || 0), 0) / total,
                co2: effectiveLogs.reduce((s, i) => s + (Number(i.co2) || 700), 0) / total,
                pm25: effectiveLogs.reduce((s, i) => s + (Number(i.pm2_5 || i.pm25) || 10), 0) / total
              };

              const co2Score = Math.max(0, 100 - (avgs.co2 > 1000 ? (avgs.co2 - 1000) * 0.1 : 0));
              const tempScore = Math.max(0, 100 - (avgs.temp > 25 ? (avgs.temp - 25) * 10 : (23 - avgs.temp) * 10));
              const humScore = Math.max(0, 100 - (avgs.hum > 60 ? (avgs.hum - 60) * 3 : 0));
              const pm25Score = Math.max(0, 100 - (avgs.pm25 > 37.5 ? (avgs.pm25 - 37.5) * 2 : 0));
              const soundScore = avgs.sound > 1000 ? 50 : 100;
              const lightScore = avgs.light > 10 ? 70 : 100;

              const roomScore = Math.round(
                (co2Score * 0.2) + (tempScore * 0.25) + (humScore * 0.15) +
                (pm25Score * 0.1) + (soundScore * 0.2) + (lightScore * 0.1)
              );

              const garminScore = Number(garmin.garminSleepScore) || 75;
              const combinedScore = Math.round((garminScore + roomScore) / 2);

              // 2. Data Integrity: บันทึกลง History เฉพาะวันที่ Match กันจริงเท่านั้น
              if (isTimestampMatched) {
                const historyItemRef = ref(database, `personal_sensitivity/history/${standardDateKey}`);
                await set(historyItemRef, {
                  date: standardDateKey,
                  garminScore: garminScore,
                  roomScore: roomScore,
                  combinedScore: combinedScore,
                  primaryTrigger: avgs.co2 > 1000 ? 'co2' : avgs.temp > 25 ? 'temperature' : 'sound',
                  restlessCount: Number(garmin.restlessMomentsCount) || 0
                });
              }

              // บันทึกค่าวันล่าสุดเพื่อแสดงใน Summary ของหน้าแรก
              if (!latestDate) {
                latestDate = standardDateKey;
                latestRoomEnvScore = roomScore;
                latestCombinedScore = combinedScore;

                const geminiRes = await fetch('/api/gemini', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sensorAverages: avgs, restlessCount: garmin.restlessMomentsCount || 0 })
                }).catch(() => null);

                const geminiJson = geminiRes ? await geminiRes.json() : null;
                latestAiData = geminiJson?.data;
              }
            }

            // 3. อัปเดตข้อมูลสรุปหน้าหลัก
            if (sortedDates.length > 0 && garminData[sortedDates[0]]) {
              const latestGarmin = garminData[sortedDates[0]];
              const summaryRef = ref(database, 'personal_sensitivity/summary');
              set(summaryRef, {
                evaluatedDate: latestDate,
                dailyMetrics: {
                  garminSleepScore: latestGarmin.garminSleepScore,
                  roomEnvironmentScore: latestRoomEnvScore,
                  combinedSleepScore: latestCombinedScore,
                  restlessMoments: latestGarmin.restlessMomentsCount || 0
                },
                aiInsight: {
                  diagnosis: latestAiData?.diagnosis,
                  recommendation: latestAiData?.recommendation
                }
              });
            }
          }, { onlyOnce: true });
        }, { onlyOnce: true });
      } catch (e) {
        console.error('Auto Sync History Error:', e);
      }
    };

    processAutoSync();
  }, []);

  useEffect(() => {
    if (!database) return;
    const summaryRef = ref(database, 'personal_sensitivity/summary');
    const unsub = onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) setSummaryData(snapshot.val());
    });
    return () => unsub();
  }, []);

  const daily = summaryData?.dailyMetrics;
  const aiInsight = summaryData?.aiInsight;

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

        {/* 4 Capsule Pill Buttons */}
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
        <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
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
              🎯 COMBINED SLEEP SCORE ({summaryData?.evaluatedDate || 'ล่าสุด'})
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

        {/* Gemini AI Diagnosis */}
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