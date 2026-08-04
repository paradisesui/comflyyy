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

export default function PersonaPage() {
  const [sensitivity, setSensitivity] = useState({
    temperature: 'High',
    sound: 'High',
    light: 'Medium',
  });

  const [isWatchConnected, setIsWatchConnected] = useState<boolean>(true);
  const [logs, setLogs] = useState<SleepLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const logsRef = ref(database, 'logs');
      const latestLogsQuery = query(logsRef, limitToLast(20));

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
      padding: '60px 20px 40px 20px' // ขยับกรอบลงมาจากด้านบน 60px
    }}>
      <style jsx>{`
        .persona-container {
          width: 96vw;
          max-width: 1600px;
          background-color: #0f172a;
          border-radius: 32px;
          border: 1px solid #1e293b;
          padding: 32px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .top-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        .logs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 900px) {
          .persona-container {
            padding: 40px;
            gap: 28px;
          }
          .top-grid {
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
          .logs-grid {
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
        }
      `}</style>

      <main className="persona-container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
            ประวัติการใช้งาน & Smart Watch
          </h1>
          <div style={{ width: '40px' }}></div>
        </div>

        {/* Top Grid */}
        <div className="top-grid">
          <section style={{
            backgroundColor: '#162032',
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>⌚</span>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: '700', display: 'block' }}>Smart Watch Sync</span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {isWatchConnected ? 'รอการเชื่อมต่อ Garmin API' : 'ปิดการเชื่อมต่อ'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsWatchConnected(!isWatchConnected)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: isWatchConnected ? '#10b98120' : '#334155',
                  color: isWatchConnected ? '#34d399' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {isWatchConnected ? '• Ready Sync' : 'Connect'}
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
              ระบบจะนำข้อมูล Timestamp ภาวะสะดุ้งตื่นจาก Smart Watch มาจับคู่กับค่าเซนเซอร์จาก Firebase โดยอัตโนมัติ
            </p>
          </section>

          <section style={{
            backgroundColor: '#162032',
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <h2 style={{ fontSize: '15px', color: '#38bdf8', margin: 0, fontWeight: '700' }}>
              🎯 ระดับความไวต่อสิ่งรบกวนเฉพาะบุคคล
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#cbd5e1' }}>🌡️ อุณหภูมิห้อง</span>
                <select
                  value={sensitivity.temperature}
                  onChange={(e) => setSensitivity({ ...sensitivity, temperature: e.target.value })}
                  style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '8px', padding: '6px 12px', fontSize: '13px' }}
                >
                  <option value="High">ไวมาก (High)</option>
                  <option value="Medium">ปานกลาง</option>
                  <option value="Low">ทนได้ดี</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#cbd5e1' }}>🔊 เสียงรบกวน</span>
                <select
                  value={sensitivity.sound}
                  onChange={(e) => setSensitivity({ ...sensitivity, sound: e.target.value })}
                  style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '8px', padding: '6px 12px', fontSize: '13px' }}
                >
                  <option value="High">ไวมาก (High)</option>
                  <option value="Medium">ปานกลาง</option>
                  <option value="Low">ทนได้ดี</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#cbd5e1' }}>💡 แสงสว่าง</span>
                <select
                  value={sensitivity.light}
                  onChange={(e) => setSensitivity({ ...sensitivity, light: e.target.value })}
                  style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '8px', padding: '6px 12px', fontSize: '13px' }}
                >
                  <option value="High">ไวมาก (High)</option>
                  <option value="Medium">ปานกลาง</option>
                  <option value="Low">ทนได้ดี</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Real Firebase Disruption Logs */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', color: '#f8fafc', margin: 0, fontWeight: '700' }}>
              📊 ประวัติค่าเซนเซอร์ย้อนหลังจริง (Firebase Database)
            </h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {logs.length} รายการล่าสุด
            </span>
          </div>

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
                  padding: '20px',
                  borderRadius: '20px',
                  border: log.isDisrupted ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#38bdf8' }}>
                      ⏱️ {log.dateString} - {log.timeString} น.
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '10px',
                      backgroundColor: log.isDisrupted ? '#ef444420' : '#10b98120',
                      color: log.isDisrupted ? '#f87171' : '#34d399',
                      fontWeight: '700'
                    }}>
                      {log.isDisrupted ? 'มีปัจจัยรบกวน' : 'สภาวะปกติ'}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', margin: 0, fontWeight: '600', color: '#f1f5f9' }}>
                    {log.disruptionCause}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#94a3b8',
                    marginTop: '4px',
                    backgroundColor: '#0f172a',
                    padding: '12px',
                    borderRadius: '14px'
                  }}>
                    <div>🌡️ อุณหภูมิ: <strong style={{ color: '#fff', display: 'block' }}>{log.temperature.toFixed(1)}°C</strong></div>
                    <div>💧 ความชื้น: <strong style={{ color: '#fff', display: 'block' }}>{log.humidity.toFixed(0)}%</strong></div>
                    <div>💡 แสง: <strong style={{ color: '#fff', display: 'block' }}>{log.lux.toFixed(1)} Lux</strong></div>
                    <div>🍃 CO2: <strong style={{ color: '#fff', display: 'block' }}>{log.co2} ppm</strong></div>
                    <div>🔊 เสียง: <strong style={{ color: '#fff', display: 'block' }}>{log.sound}</strong></div>
                    <div>🌫️ PM2.5: <strong style={{ color: '#fff', display: 'block' }}>{log.pm2_5} µg</strong></div>
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
          fontSize: '15px',
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