'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database, auth } from '@/app/lib/firebase';
import { ref, query, limitToLast, onValue } from 'firebase/database';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GoogleGenAI } from '@google/genai';

interface LogItem {
  id: string;
  temperature: number;
  humidity: number;
  co2: number;
  lux: number;
  pm2_5: number;
  sound: number;
  timestamp: number;
}

export default function PersonaHistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sensitivityProfile, setSensitivityProfile] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const logsRef = ref(database, 'logs');
        const latestLogsQuery = query(logsRef, limitToLast(20));

        const unsubscribeLogs = onValue(latestLogsQuery, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const logList: LogItem[] = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            })).reverse();

            setLogs(logList);
          }
          setLoading(false);
        });

        return () => unsubscribeLogs();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

// ฟังก์ชันวิเคราะห์ความ Sensitive โดยเรียกผ่าน /api/gemini
  const analyzeSensitivity = async () => {
    if (logs.length === 0) return;
    setAnalyzing(true);
    setSensitivityProfile('');

    try {
      // 1. คำนวณค่าเฉลี่ยและค่าสูงสุดจากประวัติ
      const avgTemp = (logs.reduce((acc, curr) => acc + (curr.temperature || 0), 0) / logs.length).toFixed(1);
      const avgCo2 = (logs.reduce((acc, curr) => acc + (curr.co2 || 0), 0) / logs.length).toFixed(0);
      const maxSound = Math.max(...logs.map(l => l.sound || 0));
      const avgLux = (logs.reduce((acc, curr) => acc + (curr.lux || 0), 0) / logs.length).toFixed(1);

      const promptText = `คุณเป็น AI ผู้เชี่ยวชาญด้านเวชศาสตร์การนอนและการวิเคราะห์พฤติกรรมเฉพาะบุคคล (Personalized Sleep Profiler)
โปรดวิเคราะห์ความ Sensitive (ความไวต่อสิ่งรบกวน) ของผู้ใช้คนนี้จากประวัติค่าเซนเซอร์สิ่งแวดล้อมที่บันทึกไว้ดังนี้:
- อุณหภูมิเฉลี่ย: ${avgTemp} °C
- CO2 เฉลี่ย: ${avgCo2} ppm
- ระดับเสียงสูงสุดที่เคยพบ: ${maxSound}
- ความสว่างเฉลี่ย: ${avgLux} Lux
- จำนวนข้อมูลที่บันทึก: ${logs.length} รายการ

คำสั่ง:
1. ประเมินและสรุปว่าผู้ใช้คนนี้มีแนวโน้ม "Sensitive ต่อปัจจัยใดมากที่สุด" (เช่น ไวต่ออุณหภูมิร้อนเกินไป, ไวต่อเสียงรบกวนฉับพลัน หรือไวต่ออากาศอับ CO2 สูง)
2. เขียนสรุปโปรไฟล์ความไวเฉพาะบุคคลเป็นข้อๆ สั้นๆ เข้าใจง่าย 3 ข้อ สไตล์เป็นกันเองและให้กำลังใจ`;

      // 2. ส่ง request ไปยัง /api/gemini ของ Next.js
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await res.json();

      if (res.ok && data.result) {
        setSensitivityProfile(data.result);
      } else {
        setSensitivityProfile(`เกิดข้อผิดพลาด: ${data.error || 'ไม่สามารถวิเคราะห์ข้อมูลได้'}`);
      }
    } catch (err: any) {
      console.error(err);
      setSensitivityProfile('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <main style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#0f172a',
        borderRadius: '28px',
        border: '1px solid #1e293b',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            ← กลับหน้าหลัก
          </Link>
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '700' }}>
            วิเคราะห์ความ Sensitive
          </h2>
        </header>

        {!user ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
              กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์ความ Sensitive ของคุณ
            </p>
            <Link href="/account" style={{
              backgroundColor: '#10b981',
              color: '#022c22',
              padding: '10px 20px',
              borderRadius: '12px',
              fontWeight: '700',
              textDecoration: 'none',
              fontSize: '14px'
            }}>
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <>
            {/* กล่องประเมิน Sensitive Profile จาก AI */}
            <div style={{
              backgroundColor: '#162032',
              padding: '16px',
              borderRadius: '20px',
              border: '1px solid #8b5cf660',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🧠 โปรไฟล์ความไวเฉพาะบุคคล
                </span>
                <button
                  onClick={analyzeSensitivity}
                  disabled={analyzing || logs.length === 0}
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {analyzing ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ประวัติ'}
                </button>
              </div>

              {sensitivityProfile ? (
                <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {sensitivityProfile}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  กดปุ่ม "วิเคราะห์ประวัติ" เพื่อให้ Gemini AI วิเคราะห์ว่าร่างกายของคุณ Sensitive ต่อปัจจัยใดในห้องนอนมากที่สุด
                </p>
              )}
            </div>

            {/* รายการประวัติย้อนหลัง */}
            <h3 style={{ fontSize: '14px', color: '#94a3b8', margin: '10px 0 0 0' }}>📜 ประวัติการบันทึกล่าสุด</h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>กำลังโหลด...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {logs.map((item) => (
                  <div key={item.id} style={{
                    backgroundColor: '#162032',
                    padding: '12px',
                    borderRadius: '14px',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      ⏰ {item.timestamp ? new Date(item.timestamp * 1000).toLocaleString('th-TH') : 'ไม่ระบุเวลา'}
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', fontSize: '12px' }}>
                      <div><span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>Temp</span>{item.temperature?.toFixed(1)}°C</div>
                      <div><span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>Hum</span>{item.humidity?.toFixed(0)}%</div>
                      <div><span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>CO2</span>{item.co2}</div>
                      <div><span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>Sound</span>{item.sound}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}