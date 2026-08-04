'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, query, limitToLast, onValue } from 'firebase/database';

interface SensorData {
  co2: number;
  humidity: number;
  lux: number;
  pm2_5: number;
  sound: number;
  temperature: number;
  timestamp: number;
}

interface SmartWatchData {
  heartRate: number;
  sleepStage: 'Deep' | 'Light' | 'REM' | 'Awake';
  movement: 'Quiet' | 'Restless';
  isArousal: boolean; // มีภาวะสะดุ้งตื่น/หัวใจเต้นเร็วผิดปกติ
}

interface SleepDisruptionLog {
  id: string;
  timeString: string;
  disruptionCause: string;
  watchData: SmartWatchData;
  sensorData: Partial<SensorData>;
}

export default function PersonaPage() {
  const [sensitivity, setSensitivity] = useState({
    temperature: 'High', // High, Medium, Low
    sound: 'High',
    light: 'Medium',
  });

  const [isWatchConnected, setIsWatchConnected] = useState<boolean>(true);
  const [logs, setLogs] = useState<SleepDisruptionLog[]>([]);

  // จำลองดึงข้อมูลประวัติการสะดุ้งตื่นที่ Timestamp ตรงกันระหว่าง Smart Watch และ Sensor
  useEffect(() => {
    try {
      const logsRef = ref(database, 'logs');
      const latestLogsQuery = query(logsRef, limitToLast(5));

      const unsubscribe = onValue(latestLogsQuery, (snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          const mockDisruptionLogs: SleepDisruptionLog[] = Object.keys(rawData).map((key, index) => {
            const item = rawData[key];
            const date = item.timestamp ? new Date(item.timestamp) : new Date();
            const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

            // สุ่มระบุสาเหตุรบกวนตามค่าเซนเซอร์ที่เกินเกณฑ์
            let cause = 'สภาพแวดล้อมปกติ';
            if (item.temperature > 25) cause = 'อุณหภูมิห้องสูงเกินไป';
            else if (item.lux > 5) cause = 'แสงสว่างรบกวนตา';
            else if (item.sound > 1000) cause = 'เสียงรบกวนสะดุ้งตื่น';

            return {
              id: key,
              timeString: timeStr,
              disruptionCause: cause,
              watchData: {
                heartRate: 72 + (index * 4),
                sleepStage: item.temperature > 25 ? 'Light' : 'Deep',
                movement: item.sound > 1000 ? 'Restless' : 'Quiet',
                isArousal: item.temperature > 25 || item.sound > 1000,
              },
              sensorData: {
                temperature: item.temperature,
                lux: item.lux,
                sound: item.sound,
                humidity: item.humidity,
              }
            };
          });

          setLogs(mockDisruptionLogs.reverse());
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.error(e);
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
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>
            ← ย้อนกลับ
          </Link>
          <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
            Sleep Persona & Sync
          </h1>
          <div style={{ width: '40px' }}></div>
        </div>

        {/* สถานะ Smart Watch */}
        <section style={{
          backgroundColor: '#162032',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>⌚</span>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '700', display: 'block' }}>Smart Watch Sync</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {isWatchConnected ? 'เชื่อมต่อแล้ว (Apple Watch / Garmin)' : 'ยังไม่ได้เชื่อมต่อ'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsWatchConnected(!isWatchConnected)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: isWatchConnected ? '#10b98120' : '#334155',
              color: isWatchConnected ? '#34d399' : '#94a3b8',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {isWatchConnected ? '• Live Sync' : 'Connect'}
          </button>
        </section>

        {/* ตั้งค่าความไวเฉพาะบุคคล (Sensitivity Profile) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '14px', color: '#94a3b8', margin: 0, fontWeight: '600' }}>
            🎯 ความไวต่อสิ่งรบกวนเฉพาะบุคคล (Sensitivity)
          </h2>
          <div style={{
            backgroundColor: '#162032',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>🌡️ ตื่นง่ายเมื่อร้อน/อุ่น</span>
              <select
                value={sensitivity.temperature}
                onChange={(e) => setSensitivity({ ...sensitivity, temperature: e.target.value })}
                style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '8px', padding: '4px 8px', fontSize: '12px' }}
              >
                <option value="High">ไวมาก (High)</option>
                <option value="Medium">ปานกลาง</option>
                <option value="Low">ทนได้ดี</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>🔊 สะดุ้งตื่นเมื่อมีเสียง</span>
              <select
                value={sensitivity.sound}
                onChange={(e) => setSensitivity({ ...sensitivity, sound: e.target.value })}
                style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '8px', padding: '4px 8px', fontSize: '12px' }}
              >
                <option value="High">ไวมาก (High)</option>
                <option value="Medium">ปานกลาง</option>
                <option value="Low">ทนได้ดี</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#cbd5e1' }}>💡 ตอบสนองต่อแสงสว่าง</span>
              <select
                value={sensitivity.light}
                onChange={(e) => setSensitivity({ ...sensitivity, light: e.target.value })}
                style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '8px', padding: '4px 8px', fontSize: '12px' }}
              >
                <option value="High">ไวมาก (High)</option>
                <option value="Medium">ปานกลาง (Medium)</option>
                <option value="Low">ทนได้ดี</option>
              </select>
            </div>
          </div>
        </section>

        {/* ประวัติการตื่นย้อนหลัง (Disruption Log) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontSize: '14px', color: '#94a3b8', margin: 0, fontWeight: '600' }}>
            📊 ประวัติการตื่น timestamp กับค่าเซนเซอร์
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logs.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>กำลังดึงข้อมูลประวัติ...</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{
                  backgroundColor: '#162032',
                  padding: '14px',
                  borderRadius: '16px',
                  border: log.watchData.isArousal ? '1px solid #ef444450' : '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8' }}>
                      ⏱️ {log.timeString}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: log.watchData.isArousal ? '#ef444420' : '#10b98120',
                      color: log.watchData.isArousal ? '#f87171' : '#34d399',
                      fontWeight: '700'
                    }}>
                      {log.watchData.isArousal ? 'สะดุ้งตื่น / ตื่นตัว' : 'หลับสนิท'}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', margin: 0, fontWeight: '600', color: '#f1f5f9' }}>
                    สาเหตุ: {log.disruptionCause}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginTop: '4px',
                    backgroundColor: '#0f172a',
                    padding: '8px',
                    borderRadius: '10px'
                  }}>
                    <div>⌚ หัวใจ: <strong style={{ color: '#fff' }}>{log.watchData.heartRate} bpm</strong></div>
                    <div>⌚ สถานะ: <strong style={{ color: '#fff' }}>{log.watchData.sleepStage} Sleep</strong></div>
                    <div>🌡️ อุณหภูมิ: <strong style={{ color: '#fff' }}>{log.sensorData.temperature?.toFixed(1)}°C</strong></div>
                    <div>💡 แสง: <strong style={{ color: '#fff' }}>{log.sensorData.lux?.toFixed(1)} Lux</strong></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <Link href="/" style={{
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          padding: '12px',
          borderRadius: '14px',
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '14px',
          textDecoration: 'none',
          border: '1px solid #334155'
        }}>
          กลับหน้าหลัก
        </Link>
      </main>
    </div>
  );
}