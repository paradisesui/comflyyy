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

export default function SensitivityReportPage() {
  const [stats, setStats] = useState({
    tempSpikes: 0,
    soundSpikes: 0,
    lightSpikes: 0,
    totalLogs: 0,
    topSensitivity: 'กำลังวิเคราะห์...'
  });
  const [loading, setLoading] = useState(true);

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

          let top = 'อุณหภูมิ (Temperature)';
          if (sCount > tCount && sCount > lCount) top = 'เสียงรบกวน (Noise Spikes)';
          if (lCount > tCount && lCount > sCount) top = 'แสงสว่าง (Light Disruptions)';

          setStats({
            tempSpikes: tCount,
            soundSpikes: sCount,
            lightSpikes: lCount,
            totalLogs: total,
            topSensitivity: top
          });
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '24px 14px'
    }}>
      <main style={{
        width: '100%',
        maxWidth: '800px',
        backgroundColor: '#151c2c',
        borderRadius: '24px',
        border: '1px solid #1e293b',
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#818cf8', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
            ← กลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Sensor-based Analysis</span>
        </div>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', color: '#f8fafc' }}>
            🎯 ผลวิเคราะห์ความไวต่อสิ่งรบกวน (Sleep Sensitivity)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
            คำนวณจากประวัติเซนเซอร์จริง {stats.totalLogs} รายการล่าสุด ร่วมกับสถิติเวลาที่ตรวจพบการสะดุ้งตื่น
          </p>
        </div>

        {/* Top Vulnerability Banner */}
        <div style={{
          backgroundColor: '#1e1b4b',
          padding: '20px',
          borderRadius: '18px',
          border: '1px solid #4338ca',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: '700' }}>
            ⚠️ ปัจจัยกระตุ้นการตื่นอันดับ 1 ของคุณ
          </span>
          <h2 style={{ fontSize: '24px', color: '#fbbf24', fontWeight: '800', margin: 0 }}>
            {loading ? '⏳ กำลังคำนวณ...' : stats.topSensitivity}
          </h2>
          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: '1.5' }}>
            ร่างกายของคุณมีแนวโน้มตอบสนองและสะดุ้งตื่นง่ายที่สุดเมื่อปัจจัยนี้หลุดจากเกณฑ์มาตรฐาน
          </p>
        </div>

        {/* Data Breakdown Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '700' }}>
            📊 สถิติอัตราการหลุดเกณฑ์เปรียบเทียบ
          </span>

          {/* Temp */}
          <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>🌡️ ความไวต่ออุณหภูมิ (&gt; 25°C)</span>
              <strong style={{ color: '#f59e0b' }}>{stats.tempSpikes} ครั้ง</strong>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (stats.tempSpikes / (stats.totalLogs || 1)) * 100)}%`, height: '100%', backgroundColor: '#f59e0b' }}></div>
            </div>
          </div>

          {/* Sound */}
          <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>🔊 ความไวต่อเสียงรบกวน (&gt; 1000)</span>
              <strong style={{ color: '#ef4444' }}>{stats.soundSpikes} ครั้ง</strong>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (stats.soundSpikes / (stats.totalLogs || 1)) * 100)}%`, height: '100%', backgroundColor: '#ef4444' }}></div>
            </div>
          </div>

          {/* Light */}
          <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '14px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>💡 ความไวต่อแสงสว่าง (&gt; 5 Lux)</span>
              <strong style={{ color: '#38bdf8' }}>{stats.lightSpikes} ครั้ง</strong>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (stats.lightSpikes / (stats.totalLogs || 1)) * 100)}%`, height: '100%', backgroundColor: '#38bdf8' }}></div>
            </div>
          </div>
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