'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function HomePage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [sensorAverages, setSensorAverages] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. กระบวนการคำนวณตาม Flowchart
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

          // Data Matching: จับคู่ค่าตัวแปรและเวลานอน
          const matchedSleepLogs = logKeys.map(k => rawLogs[k]).filter((log: any) => {
            let t = Number(log.timestamp) || 0;
            if (t < 1000000000000) t = t * 1000;
            return t >= sleepStart && t <= sleepEnd;
          });

          const effectiveLogs = matchedSleepLogs.length > 0 ? matchedSleepLogs : logKeys.slice(-30).map(k => rawLogs[k]);
          const totalLogs = effectiveLogs.length || 1;

          // ค่าเฉลี่ยตัวแปรที่ Matching แล้ว
          const avgs = {
            temp: effectiveLogs.reduce((s, i) => s + (Number(i.temperature) || 26.5), 0) / totalLogs,
            hum: effectiveLogs.reduce((s, i) => s + (Number(i.humidity) || 52), 0) / totalLogs,
            sound: effectiveLogs.reduce((s, i) => s + (Number(i.sound) || 28), 0) / totalLogs,
            light: effectiveLogs.reduce((s, i) => s + (Number(i.light_lux) || 0), 0) / totalLogs,
            co2: effectiveLogs.reduce((s, i) => s + (Number(i.co2) || 650), 0) / totalLogs,
            pm25: effectiveLogs.reduce((s, i) => s + (Number(i.pm25) || 8), 0) / totalLogs
          };
          setSensorAverages(avgs);

          // Gemini AI Diagnose -> รับ Personalized Weights
          const geminiRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensorAverages: avgs, restlessCount: garmin.restlessMomentsCount || 0 })
          }).catch(() => null);

          const geminiJson = geminiRes ? await geminiRes.json() : null;
          const aiData = geminiJson?.data;
          const weights = aiData?.weights || { co2: 0.2, temp: 0.25, hum: 0.15, pm25: 0.1, sound: 0.2, light: 0.1 };

          // เทียบเกณฑ์มาตรฐาน (Sub-scores 0-100)
          const co2Score = Math.max(0, 100 - (avgs.co2 > 1000 ? (avgs.co2 - 1000) * 0.1 : 0));
          const tempScore = Math.max(0, 100 - (avgs.temp > 25 ? (avgs.temp - 25) * 10 : (23 - avgs.temp) * 10));
          const humScore = Math.max(0, 100 - (avgs.hum > 60 ? (avgs.hum - 60) * 3 : 0));
          const pm25Score = Math.max(0, 100 - (avgs.pm25 > 37.5 ? (avgs.pm25 - 37.5) * 2 : 0));
          const soundScore = avgs.sound > 1000 ? 50 : 100;
          const lightScore = avgs.light > 10 ? 70 : 100;

          // คำนวณ (weight) * (ค่าตัวแปรที่เทียบเกณฑ์) -> Room envi score
          const roomEnviScore = Math.round(
            (co2Score * weights.co2) +
            (tempScore * weights.temp) +
            (humScore * weights.hum) +
            (pm25Score * weights.pm25) +
            (soundScore * weights.sound) +
            (lightScore * weights.light)
          );

          // Combine กับ Garmin
          const combinedSleepScore = Math.round((garmin.garminSleepScore + roomEnviScore) / 2);

          // บันทึกลง Firebase
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

  // 2. อ่านข้อมูลจาก Firebase
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
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px 12px 32px 12px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <main style={{ width: '100%', maxWidth: '920px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Navigation Header */}
        <header style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '9999px',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌙</span>
            <strong style={{ fontSize: '15px', color: '#f8fafc' }}>COMFY SLEEP</strong>
          </div>
          <nav style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            <Link href="/sensors" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '12px', padding: '6px 12px', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)' }}>🛏️ Comfy Room</Link>
            <Link href="/persona" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '12px', padding: '6px 12px', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)' }}>⌚ Smart Watch & Persona</Link>
            <Link href="/sensitivity" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '12px', padding: '6px 12px', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)' }}>🎯 Sensitivity</Link>
            <Link href="/sensitivity-profile" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '12px', padding: '6px 12px', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)' }}>📜 ประวัติสะสม</Link>
            <Link href="/account" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '12px', padding: '6px 12px', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)' }}>👤 Account</Link>
          </nav>
        </header>

        {/* Combined Sleep Score Card */}
        <section style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800' }}>RESULT: COMBINED SLEEP SCORE</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '36px', fontWeight: '800', color: '#38bdf8' }}>{daily?.combinedSleepScore ?? '--'}</span>
            <span style={{ fontSize: '14px', color: '#64748b' }}>/ 100</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>
              (Garmin: {daily?.garminSleepScore ?? '--'} | Room Env: {daily?.roomEnvironmentScore ?? '--'})
            </span>
          </div>
        </section>

        {/* AI Diagnosis & Recommendations */}
        <section style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <span style={{ fontSize: '11px', color: '#facc15', fontWeight: '800' }}>🤖 ผลวิเคราะห์สาเหตุและคำแนะนำจาก AI (GEMINI DIAGNOSIS)</span>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
            {aiInsight?.diagnosis || "กำลังวิเคราะห์สาเหตุเชิงลึก..."}
          </h2>
          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
            💡 <strong>คำแนะนำ AI:</strong> {aiInsight?.recommendation || "กำลังประมวลผลคำแนะนำ..."}
          </p>
        </section>
      </main>
    </div>
  );
}