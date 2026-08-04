'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, query, limitToLast, onValue } from 'firebase/database';

interface SleepLogItem {
  temperature: number;
  lux: number;
  sound: number;
  co2: number;
  timestamp: number;
}

export default function SmartWatchPersonaPage() {
  const [isWatchConnected, setIsWatchConnected] = useState<boolean>(true);
  const [simulatedArousal, setSimulatedArousal] = useState<string | null>(null);

  // สถิติวิเคราะห์จุดอ่อนอัตโนมัติจากเซนเซอร์
  const [autoProfile, setAutoProfile] = useState({
    topSensitivity: 'กำลังประมวลผล...',
    tempPercent: 0,
    soundPercent: 0,
    lightPercent: 0,
    loading: true
  });

  // คำนวณความไวอัตโนมัติจาก Firebase
  useEffect(() => {
    try {
      const logsRef = ref(database, 'logs');
      const latestLogsQuery = query(logsRef, limitToLast(50));

      const unsubscribe = onValue(latestLogsQuery, (snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          let tCount = 0;
          let sCount = 0;
          let lCount = 0;
          let total = 0;

          Object.keys(rawData).forEach((key) => {
            const log: SleepLogItem = rawData[key];
            total++;
            if ((log.temperature ?? 0) > 25) tCount++;
            if ((log.sound ?? 0) > 1000) sCount++;
            if ((log.lux ?? 0) > 5) lCount++;
          });

          const totalSafe = total || 1;
          let top = 'อุณหภูมิห้อง (High Temp Sensitivity)';
          if (sCount > tCount && sCount > lCount) top = 'เสียงรบกวน (Noise Spikes)';
          if (lCount > tCount && lCount > sCount) top = 'แสงสว่าง (Light Disruptions)';

          setAutoProfile({
            topSensitivity: top,
            tempPercent: Math.round((tCount / totalSafe) * 100),
            soundPercent: Math.round((sCount / totalSafe) * 100),
            lightPercent: Math.round((lCount / totalSafe) * 100),
            loading: false
          });
        } else {
          setAutoProfile(prev => ({ ...prev, loading: false }));
        }
      });

      return () => unsubscribe();
    } catch (e) {
      setAutoProfile(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const handleSimulateSpike = () => {
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSimulatedArousal(`จำลองพบภาวะสะดุ้งตื่น (Heart Rate Spike: 88 bpm) ณ เวลา ${timeStr} น. จับคู่กับค่าเซนเซอร์ลง Firebase เรียบร้อย`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '24px 14px'
    }}>
      <style jsx>{`
        .persona-container {
          width: 100%;
          max-width: 900px;
          background-color: #151c2c;
          border-radius: 24px;
          border: 1px solid #1e293b;
          padding: 20px 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .header-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .persona-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 900px) {
          .persona-container {
            padding: 32px;
            gap: 24px;
            margin-top: 20px;
          }
          .header-box {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>

      <main className="persona-container">
        {/* Header */}
        <div className="header-box">
          <Link href="/" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
            Smart Watch & Automatic Sensitivity
          </h1>
        </div>

        <div className="persona-grid">
          {/* Box 1: Smart Watch Connection Status */}
          <section style={{
            backgroundColor: '#0f172a',
            padding: '20px',
            borderRadius: '20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>⌚</span>
                <div>
                  <span style={{ fontSize: '15px', fontWeight: '700', display: 'block' }}>Smart Watch Sync</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {isWatchConnected ? 'เชื่อมต่อ Garmin / Apple Health สด' : 'ปิดการเชื่อมต่อ'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsWatchConnected(!isWatchConnected)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: isWatchConnected ? '#10b98120' : '#334155',
                  color: isWatchConnected ? '#34d399' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {isWatchConnected ? '• Connected' : 'Connect'}
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
              ระบบจะดึงค่าอัตราการเต้นของหัวใจ (Heart Rate) และช่วงเวลาตื่นกลางดึกจากนาฬิกา มาวิเคราะห์ร่วมกับเซนเซอร์อุณหภูมิ ความชื้น แสง และเสียงในห้องนอนโดยอัตโนมัติ
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: 0 }} />

            {/* Test Simulation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>🧪 ทดสอบระบบจับคู่เวลา (Simulation Test)</span>
              <button
                onClick={handleSimulateSpike}
                style={{
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ⚡ จำลองตรวจพบภาวะสะดุ้งตื่น (Simulate Heart Rate Spike)
              </button>
              {simulatedArousal && (
                <div style={{ fontSize: '12px', color: '#34d399', backgroundColor: '#10b98115', padding: '10px', borderRadius: '10px', border: '1px solid #10b98130' }}>
                  {simulatedArousal}
                </div>
              )}
            </div>
          </section>

          {/* Box 2: Automatic Sensitivity Profile (AI-Calculated) */}
          <section style={{
            backgroundColor: '#0f172a',
            padding: '20px',
            borderRadius: '20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '14px', color: '#818cf8', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🤖 AI Auto-Detected Sensitivity Profile
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  วิเคราะห์อัตโนมัติจากเซนเซอร์ (ไม่ต้องเลือกเอง)
                </span>
              </div>
              <Link href="/sensitivity" style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none', fontWeight: '700' }}>
                ดูรายงานเต็ม ➔
              </Link>
            </div>

            <div style={{
              backgroundColor: '#1e1b4b',
              padding: '14px 16px',
              borderRadius: '14px',
              border: '1px solid #4338ca'
            }}>
              <span style={{ fontSize: '11px', color: '#a5b4fc', display: 'block' }}>จุดอ่อนที่กระทบการนอนของคุณมากที่สุด:</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#fbbf24', display: 'block', marginTop: '2px' }}>
                {autoProfile.loading ? '⏳ กำลังคำนวณสถิติ...' : autoProfile.topSensitivity}
              </span>
            </div>

            {/* Live Detected Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                  <span>🌡️ อุณหภูมิสะสมหลุดเกณฑ์</span>
                  <span>{autoProfile.tempPercent}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${autoProfile.tempPercent}%`, height: '100%', backgroundColor: '#f59e0b' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                  <span>🔊 เสียงรบกวนสะดุ้งตื่น</span>
                  <span>{autoProfile.soundPercent}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${autoProfile.soundPercent}%`, height: '100%', backgroundColor: '#ef4444' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                  <span>💡 แสงสว่างรบกวน</span>
                  <span>{autoProfile.lightPercent}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${autoProfile.lightPercent}%`, height: '100%', backgroundColor: '#38bdf8' }}></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <Link href="/" style={{
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          padding: '14px',
          borderRadius: '14px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '13px',
          textDecoration: 'none',
          border: '1px solid #334155',
          marginTop: 'auto'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}