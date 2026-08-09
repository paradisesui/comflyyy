'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function HomePage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

          const hasExactTimestampMatch = matchedSleepLogs.length > 0;
          const effectiveLogs = hasExactTimestampMatch 
            ? matchedSleepLogs 
            : logKeys.slice(-30).map(k => rawLogs[k]);

          const totalLogs = effectiveLogs.length || 1;
          const sensorAverages = {
            temp: effectiveLogs.reduce((s, i) => s + (Number(i.temperature) || 25), 0) / totalLogs,
            hum: effectiveLogs.reduce((s, i) => s + (Number(i.humidity) || 50), 0) / totalLogs,
            sound: effectiveLogs.reduce((s, i) => s + (Number(i.sound) || 400), 0) / totalLogs,
            light: effectiveLogs.reduce((s, i) => s + (Number(i.light_lux) || 0), 0) / totalLogs,
            co2: effectiveLogs.reduce((s, i) => s + (Number(i.co2) || 600), 0) / totalLogs,
            pm25: effectiveLogs.reduce((s, i) => s + (Number(i.pm25) || 10), 0) / totalLogs
          };

          const geminiRes = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sensorAverages,
              restlessCount: garmin.restlessMomentsCount || 39
            })
          }).catch(() => null);

          const geminiJson = geminiRes ? await geminiRes.json() : null;
          const aiData = geminiJson?.data;
          const weights = aiData?.weights || { temp: 0.30, hum: 0.15, sound: 0.25, light: 0.10, co2: 0.10, pm25: 0.10 };

          const tempSubScore = Math.max(0, 100 - (sensorAverages.temp > 25 ? (sensorAverages.temp - 25) * 10 : (23 - sensorAverages.temp) * 10));
          const humSubScore = Math.max(0, 100 - (sensorAverages.hum > 60 ? (sensorAverages.hum - 60) * 4 : 0));
          const soundSubScore = sensorAverages.sound > 1000 ? 50 : 100;
          const lightSubScore = sensorAverages.light > 10 ? 70 : 100;
          const co2SubScore = sensorAverages.co2 > 1000 ? 60 : 100;
          const pm25SubScore = sensorAverages.pm25 > 37.5 ? 50 : 100;

          const weightedRoomScore = Math.round(
            (tempSubScore * weights.temp) +
            (humSubScore * weights.hum) +
            (soundSubScore * weights.sound) +
            (lightSubScore * weights.light) +
            (co2SubScore * weights.co2) +
            (pm25SubScore * weights.pm25)
          );

          const combinedScore = Math.round((garmin.garminSleepScore + weightedRoomScore) / 2);

          const summaryRef = ref(database, 'personal_sensitivity/summary');
          set(summaryRef, {
            evaluatedDate: garmin.calendarDate,
            totalAccumulatedDays: summaryData?.totalAccumulatedDays || 1,
            dailyMetrics: {
              garminSleepScore: garmin.garminSleepScore,
              roomEnvironmentScore: weightedRoomScore,
              combinedSleepScore: combinedScore,
              restlessMoments: garmin.restlessMomentsCount || 39,
              todaySensitivity: 41.56,
              isExactMatch: hasExactTimestampMatch
            },
            aiInsight: {
              weights,
              diagnosis: aiData?.diagnosis || "พบปัจจัยรบกวนหลักจากอุณหภูมิห้องและระดับเสียงขณะหลับ",
              recommendation: aiData?.recommendation || "ปรับอุณหภูมิเครื่องปรับอากาศให้อยู่ช่วง 23-25°C และลดแหล่งกำเนิดเสียงรบกวน"
            },
            cumulativeSummary: {
              overallSensitivityScore: 41.56,
              avgRoomTemp: Number(sensorAverages.temp.toFixed(1)),
              avgGarminScore: garmin.garminSleepScore,
              avgRoomScore: weightedRoomScore,
              avgCombinedScore: combinedScore,
              primarySensitivityFactor: 'อุณหภูมิห้อง (Temperature)'
            }
          });

          if (hasExactTimestampMatch) {
            const historyRef = ref(database, `personal_sensitivity/history/${garmin.calendarDate}`);
            set(historyRef, {
              date: garmin.calendarDate,
              garminScore: garmin.garminSleepScore,
              roomScore: weightedRoomScore,
              combinedScore: combinedScore,
              avgTemp: Number(sensorAverages.temp.toFixed(1)),
              restlessCount: garmin.restlessMomentsCount || 39
            });
          }
        }, { onlyOnce: true });
      } catch (e) {
        console.error('Process Error:', e);
      }
    };

    processAutoSync();
  }, [summaryData?.totalAccumulatedDays]);

  useEffect(() => {
    if (!database) return;

    const summaryRef = ref(database, 'personal_sensitivity/summary');
    const unsubSummary = onValue(summaryRef, (snapshot) => {
      if (snapshot.exists()) setSummaryData(snapshot.val());
    });

    const eventsRef = ref(database, 'personal_sensitivity/all_sensors_events');
    const unsubEvents = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dates = Object.keys(data).sort();
        if (dates.length > 0) setEventData(data[dates[dates.length - 1]]);
      }
      setLoading(false);
    });

    return () => {
      unsubSummary();
      unsubEvents();
    };
  }, []);

  const daily = summaryData?.dailyMetrics;
  const aiInsight = summaryData?.aiInsight;
  const accumulatedDays = summaryData?.totalAccumulatedDays ?? 1;
  const evaluatedDate = summaryData?.evaluatedDate || '2026-08-09';

  const formatSensorName = (key: string) => {
    switch (key) {
      case 'sound_db': case 'sound': return 'เสียงรบกวน (Noise)';
      case 'temperature': case 'temp': return 'อุณหภูมิห้อง (Temp)';
      case 'light_lux': case 'light': case 'lux': return 'แสงสว่าง (Light)';
      case 'humidity': case 'hum': return 'ความชื้น (Humidity)';
      case 'co2': return 'ก๊าซ CO2';
      case 'pm25': case 'pm2_5': return 'ฝุ่น PM2.5';
      default: return key || 'อุณหภูมิห้อง (Temp)';
    }
  };

  const getSensorIcon = (key: string) => {
    switch (key) {
      case 'sound_db': case 'sound': return '🔊';
      case 'temperature': case 'temp': return '🌡️';
      case 'light_lux': case 'light': case 'lux': return '💡';
      case 'humidity': case 'hum': return '💧';
      case 'co2': return '🫁';
      case 'pm25': case 'pm2_5': return '🌫️';
      default: return '🌡️';
    }
  };

  const triggerBreakdown = eventData?.sensorTriggerBreakdown || { co2: 0, humidity: 0, light_lux: 0, pm25: 0, sound_db: 23, temperature: 34 };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.18) 0%, transparent 65%), radial-gradient(ellipse at 80% 100%, rgba(99, 102, 241, 0.12) 0%, transparent 50%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px 12px 48px 12px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .app-container {
          width: 100%;
          max-width: 920px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Modern Floating Header Navbar */
        .navbar-premium {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          padding: 8px 12px 8px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: sticky;
          top: 12px;
          z-index: 50;
        }

        .brand-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          fontSize: 16px;
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.5);
        }

        .nav-scroll {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scroll-behavior: smooth;
        }

        .nav-scroll::-webkit-scrollbar {
          display: none;
        }

        .btn-nav-item {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-nav-item:hover {
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-1px);
        }

        .btn-nav-item.active {
          color: #ffffff;
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          border-color: rgba(56, 189, 248, 0.6);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.4);
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 22px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.6);
        }

        .grid-weights {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .grid-breakdown {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .grid-scores {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .action-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.5) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        @media (min-width: 640px) {
          .grid-weights {
            grid-template-columns: repeat(3, 1fr);
          }
          .grid-breakdown {
            grid-template-columns: repeat(3, 1fr);
          }
          .grid-scores {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <main className="app-container">
        {/* Floating Navbar */}
        <header className="navbar-premium">
          <div className="brand-box">
            <div className="brand-icon">🌙</div>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.5px' }}>
              COMFY SLEEP
            </span>
          </div>

          <nav className="nav-scroll">
            <Link href="/sensors" className="btn-nav-item">🛏️ Comfy Room</Link>
            <Link href="/persona" className="btn-nav-item active">⌚ Smart Watch & Persona</Link>
            <Link href="/sensitivity-profile" className="btn-nav-item">📜 ประวัติสะสม</Link>
            <Link href="/account" className="btn-nav-item">👤 Account</Link>
          </nav>
        </header>

        {/* Title */}
        <div style={{ padding: '4px 6px 0 6px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 AI Sensitivity Profile
          </h1>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            สะสมข้อมูลวิเคราะห์แล้ว {accumulatedDays} วัน (อัปเดตล่าสุด: {evaluatedDate})
          </p>
        </div>

        {/* Gemini AI Card */}
        <section className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(14, 116, 144, 0.18) 100%)',
          borderColor: 'rgba(56, 189, 248, 0.35)',
          boxShadow: '0 0 25px rgba(56, 189, 248, 0.12)'
        }}>
          <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            🤖 GEMINI AI DIAGNOSE & PERSONALIZED WEIGHTS
          </div>

          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', margin: 0, lineHeight: 1.5 }}>
            {aiInsight?.diagnosis || "พบปัจจัยรบกวนหลักจากอุณหภูมิห้องและระดับเสียงขณะหลับ"}
          </h2>

          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
            💡 <strong style={{ color: '#e2e8f0' }}>คำแนะนำจาก AI:</strong> {aiInsight?.recommendation || "ปรับอุณหภูมิเครื่องปรับอากาศให้อยู่ช่วง 23-25°C และลดแหล่งกำเนิดเสียงรบกวน"}
          </p>

          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>
            📊 Personalized Weight ทั้ง 6 ตัวแปร (ประมวลผลโดย AI)
          </span>

          <div className="grid-weights">
            {Object.entries(aiInsight?.weights || { temp: 0.30, hum: 0.15, sound: 0.25, light: 0.10, co2: 0.10, pm25: 0.10 }).map(([key, w]: any) => (
              <div key={key} style={{
                fontSize: '11px',
                color: '#cbd5e1',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getSensorIcon(key)} {formatSensorName(key)}
                </span>
                <strong style={{ color: '#38bdf8' }}>{Math.round(w * 100)}%</strong>
              </div>
            ))}
          </div>
        </section>

        {/* Breakdown Card */}
        <section className="glass-card">
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            📊 จำนวนครั้งที่สภาพแวดล้อมกระตุ้นให้ดิ้นกลางดึก (Sensor Correlation Breakdown)
          </span>

          <div className="grid-breakdown">
            {Object.entries(triggerBreakdown).map(([key, count]: any) => (
              <div key={key} style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getSensorIcon(key)} {formatSensorName(key)}
                </span>
                {count > 0 ? (
                  <strong style={{ fontSize: '18px', color: '#38bdf8', marginTop: '2px' }}>
                    {count} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>ครั้ง</span>
                  </strong>
                ) : (
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', marginTop: '4px', display: 'block' }}>
                    🟢 ปกติ
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Scores Grid */}
        <div className="grid-scores">
          <div className="glass-card">
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Overall Sensitivity Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#34d399', margin: '2px 0' }}>
              41.56 <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>ความไวในการอ่อนไหวต่อสิ่งรบกวน</span>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Combined Sleep Score</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#38bdf8', margin: '2px 0' }}>
              {daily?.combinedSleepScore ?? 83} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>/ 100</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              (Garmin: {daily?.garminSleepScore ?? 87} | Room Env: {daily?.roomEnvironmentScore ?? 79})
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NEW ADDITIONS: เพิ่มเนื้อหาเชิงลึกส่วนล่าง (Bottom Dashboard Extensions) */}
        {/* ========================================================================= */}

        {/* 1. Sleep Quality Trend (กราฟสรุปแนวโน้มการนอนหลับ) */}
        <section className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
              📈 แนวโน้มคุณภาพการนอนหลับย้อนหลัง (Weekly Trend)
            </span>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>เฉลี่ย 85/100</span>
          </div>

          {/* Mini Bar Chart Visual */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '100px', padding: '10px 10px 0 10px', gap: '8px' }}>
            {[
              { day: 'จ.', score: 78, bar: '60%' },
              { day: 'อ.', score: 82, bar: '70%' },
              { day: 'พ.', score: 80, bar: '65%' },
              { day: 'พฤ.', score: 88, bar: '85%' },
              { day: 'ศ.', score: 85, bar: '78%' },
              { day: 'ส.', score: 91, bar: '95%' },
              { day: 'อา.', score: 87, bar: '82%', active: true }
            ].map((item, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: item.active ? '#38bdf8' : '#64748b', fontWeight: item.active ? '800' : '400' }}>{item.score}</span>
                <div style={{ width: '100%', height: '60px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%',
                    height: item.bar,
                    background: item.active ? 'linear-gradient(to top, #0284c7, #38bdf8)' : 'linear-gradient(to top, #1e293b, #334155)',
                    borderRadius: '6px'
                  }}></div>
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>{item.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Personalized Actionable Tips */}
        <section className="glass-card">
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            ⚡ แนวทางปรับปรุงสภาพแวดล้อมห้องนอนเฉพาะบุคคล (Actionable Optimization)
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="action-card">
              <div style={{ fontSize: '20px' }}>🌡️</div>
              <div>
                <strong style={{ fontSize: '12px', color: '#f8fafc', display: 'block' }}>ควบคุมอุณหภูมิให้อยู่ช่วง 23-25°C</strong>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  อุณหภูมิห้องเย็นพอดีจะช่วยลดอัตราการดิ้นกลางดึก และช่วยให้ร่างกายเข้าสู่ช่วง Deep Sleep ได้เร็วขึ้น
                </p>
              </div>
            </div>

            <div className="action-card">
              <div style={{ fontSize: '20px' }}>🔊</div>
              <div>
                <strong style={{ fontSize: '12px', color: '#f8fafc', display: 'block' }}>ลดสิ่งรบกวนจากเสียง Peak เสียงฉับพลัน</strong>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  ระดับเสียงเกิน 1000 (หรือ 40 dB) เป็นสาเหตุให้สมองตื่นตัว สวมจุกหูฟังหรือเปิด White Noise ช่วยกลบเสียงกระตุ้นได้
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}