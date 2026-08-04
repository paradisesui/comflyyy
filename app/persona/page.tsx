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
      padding: '24px 14px'
    }}>
      <style jsx>{`
        .persona-container {
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

        .title-text {
          font-size: 18px;
          font-weight: 700;
          color: #f8fafc;
          margin: 0;
          line-height: 1.3;
        }

        .top-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .logs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        /* สำหรับหน้าจอคอมพิวเตอร์ (Desktop) */
        @media (min-width: 900px) {
          .persona-container {
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
          .title-text {
            font-size: 22px;
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
        {/* Header - แยกปุ่มย้อนกลับกับหัวข้อเพื่อไม่ให้เบียดกัน */}
        <div className="header-box">
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <h1 className="title-text">
            ประวัติการใช้งาน & Smart Watch
          </h1>
        </div>

        {/* Top Grid */}
        <div className="top-grid">
          {/* Smart Watch Sync Card */}
          <section style={{
            backgroundColor: '#162032',
            padding: '18px 16px',
            borderRadius: '20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px' }}>⌚</span>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '700', display: 'block' }}>Smart Watch Sync</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {isWatchConnected ? 'รอการเชื่อมต่อ Garmin API' : 'ปิดการเชื่อมต่อ'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsWatchConnected(!isWatchConnected)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: isWatchConnected ? '#10b98120' : '#334155',
                  color: isWatchConnected ? '#34d399' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {isWatchConnected ? '• Ready Sync' : 'Connect'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
              ระบบจะนำข้อมูล Timestamp ภาวะสะดุ้งตื่นจาก Smart Watch มาจับคู่กับค่าเซนเซอร์จาก Firebase โดยอัตโนมัติ
            </p>
          </section>

          {/* Sensitivity Card */}
          <section style={{
            backgroundColor: '#162032',
            padding: '18px 16px',
            borderRadius: '20px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h2 style={{ fontSize: '13px', color: '#38bdf8', margin: 0, fontWeight: '700' }}>
              🎯 ระดับความไวต่อสิ่งรบกวนเฉพาะบุคคล
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>🌡️ อุณหภูมิห้อง</span>
                <select
                  value={sensitivity.temperature}
                  onChange={(e) => setSensitivity({ ...sensitivity, temperature: e.target.value })}
                  style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '8px', padding: '4px 8px', fontSize: '11px' }}
                >
                  <option value="High">ไวมาก (High)</option>
                  <option value="Medium">ปานกลาง</option>
                  <option value="Low">ทนได้ดี</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>🔊 เสียงรบกวน</span>
                <select
                  value={sensitivity.sound}
                  onChange={(e) => setSensitivity({ ...sensitivity, sound: e.target.value })}
                  style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '8px', padding: '4px 8px', fontSize: '11px' }}
                >
                  <option value="High">ไวมาก (High)</option>
                  <option value="Medium">ปานกลาง</option>
                  <option value="Low">ทนได้ดี</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>💡 แสงสว่าง</span>
                <select
                  value={sensitivity.light}
                  onChange={(e) => setSensitivity({ ...sensitivity, light: e.target.value })}
                  style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '8px', padding: '4px 8px', fontSize: '11px' }}
                >
                  <option value="High">ไวมาก (High)</option>
                  <option value="Medium">ปานกลาง</option>
                  <option value="Low">ทนได้ดี</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Firebase Logs Section */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '13px', color: '#f8fafc', margin: 0, fontWeight: '700' }}>
              📊 ประวัติค่าเซนเซอร์ย้อนหลังจริง (Firebase)
            </h2>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {logs.length} รายการล่าสุด
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
              ⏳ กำลังดึงข้อมูลประวัติจาก Firebase...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', backgroundColor: '#162032', borderRadius: '16px', fontSize: '13px' }}>
              ยังไม่มีข้อมูลบันทึกประวัติในระบบ Firebase
            </div>
          ) : (
            <div className="logs-grid">
              {logs.map((log) => (
                <div key={log.id} style={{
                  backgroundColor: '#162032',
                  padding: '16px',
                  borderRadius: '18px',
                  border: log.isDisrupted ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>
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

                  <p style={{ fontSize: '12px', margin: 0, fontWeight: '600', color: '#f1f5f9', lineHeight: '1.4' }}>
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
          padding: '14px',
          borderRadius: '16px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '13px',
          textDecoration: 'none',
          border: '1px solid #334155',
          marginTop: '8px'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}