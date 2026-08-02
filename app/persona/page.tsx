'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database, auth } from '@/app/lib/firebase';
import { ref, query, limitToLast, onValue } from 'firebase/database';
import { onAuthStateChanged, User } from 'firebase/auth';

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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const logsRef = ref(database, 'logs');
        const latestLogsQuery = query(logsRef, limitToLast(10));

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
            ประวัติการใช้งาน
          </h2>
        </header>

        {!user ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
              กรุณาเข้าสู่ระบบเพื่อดูประวัติการบันทึกสภาพแวดล้อม
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
        ) : loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
            กำลังโหลดประวัติ...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
            ยังไม่มีประวัติการบันทึกข้อมูล
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto' }}>
            {logs.map((item) => (
              <div key={item.id} style={{
                backgroundColor: '#162032',
                padding: '14px',
                borderRadius: '16px',
                border: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                  <span>⏰ {item.timestamp ? new Date(item.timestamp * 1000).toLocaleString('th-TH') : 'ไม่ระบุเวลา'}</span>
                  <span style={{ color: '#10b981' }}>บันทึกสำเร็จ</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>อุณหภูมิ</span>
                    <strong style={{ color: '#f1f5f9' }}>{item.temperature?.toFixed(1) ?? '--'}°C</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>ความชื้น</span>
                    <strong style={{ color: '#f1f5f9' }}>{item.humidity?.toFixed(0) ?? '--'}%</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>CO2</span>
                    <strong style={{ color: '#f1f5f9' }}>{item.co2 ?? '--'} ppm</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}