'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function HomePage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

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
          setLoading(false);
        }, { onlyOnce: true });
      } catch (e) {
        console.error('Process Error:', e);
        setLoading(false);
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
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.18) 0%, transparent 65%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px 12px 90px 12px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .app-container {
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.6);
        }

        /* Bottom Floating Navigation Bar */
        .bottom-nav {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 24px);
          max-width: 500px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 6px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.8);
        }

        .nav-btn {
          color: #94a3b8;
          text-decoration: none;
          font-size: 11px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .nav-btn.active {
          color: #ffffff;
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
        }

        .account-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f8fafc;
          text-decoration: none;
          font-size: 16px;
        }
      `}</style>

      <main className="app-container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>🌙</div>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>COMFY SLEEP</span>
        </div>

        {/* Combined Sleep Score */}
        <section className="glass-card" style={{ borderColor: 'rgba(56, 189, 248, 0.35)' }}>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.8px' }}>RESULT: COMBINED SLEEP SCORE</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '38px', fontWeight: '800', color: '#38bdf8' }}>{daily?.combinedSleepScore ?? '--'}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>/ 100</span>
            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>
              (Garmin: {daily?.garminSleepScore ?? '--'} | Room Env: {daily?.roomEnvironmentScore ?? '--'})
            </span>
          </div>
        </section>

        {/* AI Diagnosis */}
        <section className="glass-card">
          <span style={{ fontSize: '11px', color: '#facc15', fontWeight: '800' }}>🤖 ผลวิเคราะห์สาเหตุและคำแนะนำจาก AI (GEMINI DIAGNOSIS)</span>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', margin: 0, lineHeight: 1.5 }}>
            {aiInsight?.diagnosis || "กำลังประมวลผลวิเคราะห์สาเหตุเชิงลึก..."}
          </h2>
          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            💡 <strong>คำแนะนำ AI:</strong> {aiInsight?.recommendation || "กำลังประมวลผลคำแนะนำ..."}
          </p>
        </section>
      </main>

      {/* Bottom Floating Navigation */}
      <nav className="bottom-nav">
        <Link href="/sensors" className={`nav-btn ${pathname === '/sensors' ? 'active' : ''}`}>🛏️ Room</Link>
        <Link href="/persona" className={`nav-btn ${pathname === '/persona' ? 'active' : ''}`}>⌚ Persona</Link>
        <Link href="/sensitivity" className={`nav-btn ${pathname === '/sensitivity' ? 'active' : ''}`}>🎯 Sensitivity</Link>
        <Link href="/sensitivity-profile" className={`nav-btn ${pathname === '/sensitivity-profile' ? 'active' : ''}`}>📜 History</Link>
        <Link href="/account" className="account-icon-btn" title="Account">👤</Link>
      </nav>
    </div>
  );
}