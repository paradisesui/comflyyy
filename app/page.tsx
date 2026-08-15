'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue, set } from 'firebase/database';

export default function HomePage() {
  const [latestData, setLatestData] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState<any>(null);

  useEffect(() => {
    if (!database) return;

    // ดึงข้อมูลจาก history เพื่อหาวันที่ล่าสุดแบบ Dynamic เสมอ
    const historyRef = ref(database, 'personal_sensitivity/history');
    const unsubHistory = onValue(historyRef, async (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const dates = Object.keys(val).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        if (dates.length > 0) {
          const newestDateKey = dates[0];
          const newestItem = val[newestDateKey];
          setLatestData(newestItem);

          // ดึงค่า AI Insight หรือวิเคราะห์ให้วันล่าสุด
          const summaryRef = ref(database, 'personal_sensitivity/summary');
          onValue(summaryRef, (sumSnap) => {
            if (sumSnap.exists()) {
              setAiInsight(sumSnap.val().aiInsight);
            }
          }, { onlyOnce: true });
        }
      }
    });

    return () => unsubHistory();
  }, []);

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
          }} title="จัดการบัญชี">
            👤
          </Link>
        </header>

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
              backdropFilter: 'blur(16px)',
              transition: 'transform 0.2s ease'
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
              🎯 COMBINED SLEEP SCORE ({latestData?.date || 'กำลังโหลด...'})
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '64px', fontWeight: '900', color: '#38bdf8', lineHeight: 1 }}>
                {latestData?.combinedScore ?? '--'}
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
                {latestData?.garminScore ?? '--'}
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
                {latestData?.roomScore ?? '--'}
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
            {aiInsight?.diagnosis || "คุณภาพสภาพแวดล้อมและการนอนหลับโดยรวมมีความสัมพันธ์กันอย่างเหมาะสม"}
          </h2>

          <div style={{
            marginTop: '12px',
            padding: '16px',
            borderRadius: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            <p style={{ fontSize: '14px', color: '#e2e8f0', margin: 0, lineHeight: 1.7 }}>
              💡 <strong style={{ color: '#38bdf8' }}>คำแนะนำจาก AI:</strong> {aiInsight?.recommendation || "รักษาอุณหภูมิและความชื้นให้คงที่เพื่อคงประสิทธิภาพการพักผ่อน"}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}