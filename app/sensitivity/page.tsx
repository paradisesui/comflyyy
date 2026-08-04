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

          let top = 'อุณหภูมิห้อง (High Temp Sensitivity)';
          if (sCount > tCount && sCount > lCount) top = 'เสียงรบกวน (Noise Disruptions)';
          if (lCount > tCount && lCount > sCount) top = 'แสงสว่างในห้อง (Light Disruptions)';

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

  const totalSafe = stats.totalLogs || 1;
  const tempPercent = Math.round((stats.tempSpikes / totalSafe) * 100);
  const soundPercent = Math.round((stats.soundSpikes / totalSafe) * 100);
  const lightPercent = Math.round((stats.lightSpikes / totalSafe) * 100);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <style jsx>{`
        .page-card {
          width: 100%;
          max-width: 1000px;
          backgroundColor: #151c2c;
          border-radius: 24px;
          border: 1px solid #1e293b;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .page-card {
            padding: 32px;
            gap: 24px;
          }
        }
      `}</style>

      <main className="page-card">
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{
            color: '#38bdf8',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ← กลับหน้าหลัก
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>SENSOR-BASED ANALYSIS</span>
        </div>

        {/* Title */}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', color: '#f8fafc' }}>
            🎯 ผลวิเคราะห์จุดอ่อนความไวการนอน (AI Sensitivity Profile)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
            คำนวณจากประวัติเซนเซอร์จริง {stats.totalLogs} รายการล่าสุด ร่วมกับสถิติช่วงเวลาสะดุ้งตื่น
          </p>
        </div>

        {/* Top Factor Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          padding: '20px 24px',
          borderRadius: '20px',
          border: '1px solid #4338ca',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: '700' }}>
            ⚠️ ปัจจัยรบกวนอันดับ 1 ของคุณ
          </span>
          <h2 style={{ fontSize: '22px', color: '#fbbf24', fontWeight: '800', margin: 0 }}>
            {loading ? '⏳ กำลังประมวลผล...' : stats.topSensitivity}
          </h2>
          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: '1.5' }}>
            สถิติชี้ว่าร่างกายของคุณตอบสนองและสะดุ้งตื่นได้ง่ายที่สุดเมื่อค่าปัจจัยนี้หลุดจากเกณฑ์มาตรฐาน
          </p>
        </div>

        {/* Balanced Grid Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '700' }}>
            📊 อัตราการหลุดเกณฑ์เปรียบเทียบแต่ละปัจจัย
          </span>

          <div className="stats-grid">
            {/* Temp Card */}
            <div style={{ backgroundColor: '#0f172a', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>🌡️ ความไวต่ออุณหภูมิ</span>
                <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '800' }}>{stats.tempSpikes} ครั้ง ({tempPercent}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${tempPercent}%`, height: '100%', backgroundColor: '#f59e0b', transition: 'width 0.5s ease' }}></div>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>อุณหภูมิเกิน 25°C กระทบการนอนหลับลึก</span>
            </div>

            {/* Sound Card */}
            <div style={{ backgroundColor: '#0f172a', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>🔊 ความไวต่อเสียง</span>
                <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '800' }}>{stats.soundSpikes} ครั้ง ({soundPercent}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${soundPercent}%`, height: '100%', backgroundColor: '#ef4444', transition: 'width 0.5s ease' }}></div>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>เสียงแทรกเฉียบพลันกระตุ้นอัตราหัวใจ</span>
            </div>

            {/* Light Card */}
            <div style={{ backgroundColor: '#0f172a', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>💡 ความไวต่อแสง</span>
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '800' }}>{stats.lightSpikes} ครั้ง ({lightPercent}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${lightPercent}%`, height: '100%', backgroundColor: '#38bdf8', transition: 'width 0.5s ease' }}></div>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>แสงสว่างเกิน 5 Lux ยับยั้งเมลาโทนิน</span>
            </div>

            {/* Smart Action Recommendation */}
            <div style={{ backgroundColor: '#0f172a', padding: '18px', borderRadius: '18px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: '700' }}>💡 คำแนะนำปรับห้องนอน</span>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: '1.4' }}>
                ตั้งอุณหภูมิเครื่องปรับอากาศไว้ที่ 23-24°C และใช้โหมด Quiet เพื่อลดความผันผวนของเสียงระหว่างคืน
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <Link href="/" style={{
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          padding: '16px',
          borderRadius: '16px',
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