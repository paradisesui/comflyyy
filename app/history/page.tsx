'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, query, limitToLast, onValue } from 'firebase/database';

interface SensorData {
  co2?: number;
  humidity?: number;
  lux?: number;
  pm10?: number;
  pm1_0?: number;
  pm2_5?: number;
  sound?: number;
  temperature?: number;
  timestamp?: number;
}

interface SleepLogItem {
  id: string;
  timestamp: number;
  timeString: string;
  dateString: string;
  temperature: number;
  humidity: number;
  lux: number;
  co2: number;
  sound: number;
  pm2_5: number;
  disruptionCause: string;
  isDisrupted: boolean;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<SleepLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const logsRef = ref(database, 'logs');
      const latestLogsQuery = query(logsRef, limitToLast(30));

      const unsubscribe = onValue(
        latestLogsQuery,
        (snapshot) => {
          if (snapshot.exists()) {
            const rawData = snapshot.val();
            const parsedLogs: SleepLogItem[] = Object.keys(rawData).map((key) => {
              const item: SensorData = rawData[key];
              
              const logTime = item.timestamp ? new Date(item.timestamp) : new Date();
              const timeStr = logTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
              const dateStr = logTime.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

              const temp = item.temperature ?? 0;
              const lux = item.lux ?? 0;
              const sound = item.sound ?? 0;
              const hum = item.humidity ?? 0;

              let causeList: string[] = [];
              let isDisrupted = false;

              if (temp > 25) {
                causeList.push('อุณหภูมิร้อนเกินไป');
                isDisrupted = true;
              }
              if (lux > 5) {
                causeList.push('แสงสว่างรบกวน');
                isDisrupted = true;
              }
              if (sound > 1000) {
                causeList.push('เสียงรบกวนสะดุ้งตื่น');
                isDisrupted = true;
              }
              if (hum > 60) {
                causeList.push('ความชื้นสูงเกินเกณฑ์');
              }

              const disruptionCause = causeList.length > 0 ? causeList.join(' • ') : 'สภาพแวดล้อมดี เหมาะกับการนอนหลับ';

              return {
                id: key,
                timestamp: item.timestamp || Date.now(),
                timeString: timeStr,
                dateString: dateStr,
                temperature: temp,
                humidity: hum,
                lux: lux,
                co2: item.co2 ?? 0,
                sound: sound,
                pm2_5: item.pm2_5 ?? 0,
                disruptionCause,
                isDisrupted
              };
            });

            setLogs(parsedLogs.reverse());
          } else {
            setLogs([]);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Firebase Logs Error:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '24px 14px'
    }}>
      <style jsx>{`
        .history-container {
          width: 100%;
          max-width: 1600px;
          background-color: #0f172a;
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

        .logs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        @media (min-width: 900px) {
          .history-container {
            width: 96vw;
            padding: 40px;
            gap: 28px;
            margin-top: 40px;
            border-radius: 32px;
          }
          .header-box {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          .logs-grid {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
        }
      `}</style>

      <main className="history-container">
        <div className="header-box">
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
            ประวัติการตรวจวัดย้อนหลัง (Firebase)
          </h1>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
              ⏳ กำลังดึงข้อมูลประวัติจาก Firebase...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', backgroundColor: '#162032', borderRadius: '20px' }}>
              ยังไม่มีข้อมูลบันทึกประวัติในระบบ Firebase
            </div>
          ) : (
            <div className="logs-grid">
              {logs.map((log) => (
                <div key={log.id} style={{
                  backgroundColor: '#162032',
                  padding: '18px',
                  borderRadius: '20px',
                  border: log.isDisrupted ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8' }}>
                      ⏱️ {log.dateString} - {log.timeString} น.
                    </span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      backgroundColor: log.isDisrupted ? '#ef444420' : '#10b98120',
                      color: log.isDisrupted ? '#f87171' : '#34d399',
                      fontWeight: '700'
                    }}>
                      {log.isDisrupted ? 'มีปัจจัยรบกวน' : 'สภาวะปกติ'}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', margin: 0, fontWeight: '600', color: '#f1f5f9' }}>
                    {log.disruptionCause}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '6px',
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginTop: '2px',
                    backgroundColor: '#0f172a',
                    padding: '10px',
                    borderRadius: '12px'
                  }}>
                    <div>🌡️ <span style={{ color: '#fff', fontWeight: '600' }}>{log.temperature.toFixed(1)}°C</span></div>
                    <div>💧 <span style={{ color: '#fff', fontWeight: '600' }}>{log.humidity.toFixed(0)}%</span></div>
                    <div>💡 <span style={{ color: '#fff', fontWeight: '600' }}>{log.lux.toFixed(1)}Lx</span></div>
                    <div>🍃 <span style={{ color: '#fff', fontWeight: '600' }}>{log.co2}ppm</span></div>
                    <div>🔊 <span style={{ color: '#fff', fontWeight: '600' }}>{log.sound}</span></div>
                    <div>🌫️ <span style={{ color: '#fff', fontWeight: '600' }}>{log.pm2_5}µg</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Link href="/" style={{
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          padding: '16px',
          borderRadius: '18px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '14px',
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