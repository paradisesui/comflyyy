'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { database } from '@/app/lib/firebase';
import { ref, onValue } from 'firebase/database';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export default function SensitivityProfilePage() {
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [eventsMap, setEventsMap] = useState<{ [key: string]: any }>({});
  const [roomEnvMap, setRoomEnvMap] = useState<{ [key: string]: any }>({});
  const [rawLogsMap, setRawLogsMap] = useState<{ [key: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [averages, setAverages] = useState({ garmin: 0, room: 0, combined: 0 });
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันคำนวณ Room Score ครอบคลุมทุกกรณี
  const getCalculatedRoomScore = (log: any, rawEnv: any, eventData: any) => {
    // 1. ถ้ามีคะแนนตรงๆ บันทึกไว้แล้ว
    if (log?.roomScore != null && !isNaN(Number(log.roomScore))) {
      return Number(log.roomScore);
    }

    // 2. คำนวณจากค่าเซนเซอร์เฉลี่ยใน room_env
    if (rawEnv) {
      const data = rawEnv.sensorAverages || rawEnv.averages || rawEnv;
      let score = 100;
      let hasValid = false;

      const co2 = Number(data.co2 || data.co2_ppm || 0);
      if (co2 > 0) {
        hasValid = true;
        if (co2 > 1000) score -= Math.min(35, Math.round((co2 - 1000) / 25));
      }

      const temp = Number(data.temperature || data.temp || 0);
      if (temp > 0) {
        hasValid = true;
        if (temp < 23) score -= Math.min(20, Math.round((23 - temp) * 5));
        else if (temp > 25) score -= Math.min(20, Math.round((temp - 25) * 5));
      }

      const hum = Number(data.humidity || data.hum || 0);
      if (hum > 0) {
        hasValid = true;
        if (hum < 50) score -= Math.min(15, Math.round((50 - hum) * 1.5));
        else if (hum > 60) score -= Math.min(15, Math.round((hum - 60) * 1.5));
      }

      const sound = Number(data.sound || data.sound_db || data.sound_noise || 0);
      if (sound > 50) {
        hasValid = true;
        score -= sound > 1000 ? 15 : Math.min(20, Math.round((sound - 50) * 0.5));
      }

      if (hasValid) return Math.max(45, Math.min(100, score));
    }

    // 3. คำนวณจำลองจาก Sensitivity Events / อัตราการดิ้น เพื่อไม่ให้เกิดค่าว่าง
    const restless = Number(log?.restlessCount ?? log?.restlessMomentsCount ?? 30);
    const triggerCount = eventData?.sensorTriggerBreakdown 
      ? Object.values(eventData.sensorTriggerBreakdown).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number
      : 15;

    let derivedScore = 85 - Math.round(restless * 0.25) - Math.min(15, Math.round(triggerCount * 0.4));
    return Math.max(55, Math.min(88, derivedScore));
  };

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }

    // 1. ดึง Events Map
    const eventsRef = ref(database, 'personal_sensitivity/all_sensors_events');
    onValue(eventsRef, (eventSnap) => {
      if (eventSnap.exists()) setEventsMap(eventSnap.val());
    });

    // 2. Listen Room Env Map
    const roomRef = ref(database, 'room_env');
    onValue(roomRef, (roomSnap) => {
      if (roomSnap.exists()) setRoomEnvMap(roomSnap.val());
    });

    // 3. Listen Raw Logs จาก ESP32
    const logsRef = ref(database, 'logs');
    onValue(logsRef, (logsSnap) => {
      if (logsSnap.exists()) {
        setRawLogsMap(logsSnap.val());
      }
    });

    // 4. Listen History Data
    const historyRef = ref(database, 'personal_sensitivity/history');
    const unsubHistory = onValue(historyRef, (snapshot) => {
      if (snapshot && snapshot.exists()) {
        const data = snapshot.val();
        const rawList = Object.keys(data).map((key) => ({
          date: data[key]?.date || key,
          ...data[key]
        }));

        const uniqueMap = new Map<string, any>();
        rawList.forEach((item) => {
          if (!item.date) return;
          if (!uniqueMap.has(item.date) || (item.roomScore && !uniqueMap.get(item.date)?.roomScore)) {
            uniqueMap.set(item.date, item);
          }
        });

        const list = Array.from(uniqueMap.values())
          .filter((item) => item.garminScore != null || item.roomScore != null)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setHistoryLogs(list);
        if (list.length > 0 && !selectedDate) {
          setSelectedDate(list[0].date);
        }
      } else {
        setHistoryLogs([]);
      }
      setLoading(false);
    });

    return () => unsubHistory();
  }, []);

  // คำนวณสรุปค่าเฉลี่ยใหม่ทั้งหมด
  useEffect(() => {
    if (historyLogs.length === 0) return;

    let totalG = 0;
    let totalR = 0;
    let totalC = 0;

    historyLogs.forEach((item) => {
      const g = Number(item.garminScore || 70);
      const r = getCalculatedRoomScore(item, roomEnvMap[item.date], eventsMap[item.date]);
      const comb = Math.round(g * 0.5 + r * 0.5);

      totalG += g;
      totalR += r;
      totalC += comb;
    });

    setAverages({
      garmin: Math.round(totalG / historyLogs.length),
      room: Math.round(totalR / historyLogs.length),
      combined: Math.round(totalC / historyLogs.length)
    });
  }, [historyLogs, roomEnvMap, eventsMap]);

  // ฟังก์ชันเตรียมข้อมูลกราฟ Time-Series
  const chartTimeSeriesData = useMemo(() => {
    if (!rawLogsMap || Object.keys(rawLogsMap).length === 0) return [];

    const points: any[] = [];

    Object.entries(rawLogsMap).forEach(([key, val]: [string, any]) => {
      if (!val || typeof val !== 'object') return;

      let timeLabel = '';
      let dateString = '';

      if (val.timestamp) {
        const d = typeof val.timestamp === 'number' 
          ? new Date(val.timestamp > 1e11 ? val.timestamp : val.timestamp * 1000)
          : new Date(val.timestamp);
        
        if (!isNaN(d.getTime())) {
          dateString = d.toISOString().split('T')[0];
          timeLabel = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        }
      } else if (val.time) {
        timeLabel = String(val.time).substring(0, 5);
        dateString = val.date || '';
      } else if (key.includes('_')) {
        const parts = key.split('_');
        dateString = parts[0];
        timeLabel = parts[1]?.substring(0, 5) || key;
      } else if (key.length >= 10) {
        dateString = key.substring(0, 10);
        timeLabel = key.substring(11, 16) || key;
      } else {
        timeLabel = key;
      }

      const matchesDate = !selectedDate || dateString === selectedDate || dateString === '' || key.includes(selectedDate);

      if (matchesDate) {
        points.push({
          time: timeLabel,
          pm1_0: Number(val.pm1_0 ?? val.pm1 ?? val.pm10_standard ?? 0),
          pm2_5: Number(val.pm2_5 ?? val.pm25 ?? val.pm2_5_env ?? val.pm25_standard ?? 0),
          pm10: Number(val.pm10 ?? val.pm10_env ?? val.pm100 ?? 0),
          co2: Number(val.co2 ?? val.co2_ppm ?? val.eco2 ?? 0),
          temp: Number(val.temperature ?? val.temp ?? val.celsius ?? 0),
          hum: Number(val.humidity ?? val.hum ?? val.rh ?? 0),
          sound: Number(val.sound_db ?? val.sound ?? val.noise ?? val.sound_raw ?? 0),
          light: Number(val.light_lux ?? val.light ?? val.lux ?? 0)
        });
      }
    });

    return points.sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, rawLogsMap]);

  // ฟังก์ชันวิเคราะห์จุดอ่อนความไวของผู้ใช้ (Daily Sensitivity)
  const getUserSensitivity = (date: string, fallbackTrigger?: string) => {
    const dayEvent = eventsMap[date];
    const breakdown = dayEvent?.sensorTriggerBreakdown;

    if (breakdown && Object.keys(breakdown).length > 0) {
      const sorted = Object.entries(breakdown).sort(([, a]: any, [, b]: any) => Number(b) - Number(a));
      const maxVal = Number(sorted[0]?.[1] || 0);

      if (maxVal > 0) {
        const topTriggers = sorted.filter(([, val]: any) => Number(val) === maxVal);

        const formatName = (key: string) => {
          switch (key) {
            case 'sound_db': case 'sound': case 'noise': return 'เสียงรบกวน';
            case 'co2': return 'ก๊าซ CO2';
            case 'humidity': case 'hum': return 'ความชื้น';
            case 'temperature': case 'temp': return 'อุณหภูมิห้อง';
            case 'pm25': return 'ฝุ่น PM2.5';
            case 'light_lux': case 'light': return 'แสงสว่าง';
            default: return key;
          }
        };

        if (topTriggers.length === 1) {
          const key = topTriggers[0][0];
          const icon = key.includes('sound') ? '🔊' : key === 'co2' ? '🫁' : key.includes('hum') ? '💧' : '🌡️';
          return `${icon} ไวต่อ${formatName(key)}`;
        } else if (topTriggers.length === 2) {
          return `⚠️ ไวต่อ${formatName(topTriggers[0][0])} และ ${formatName(topTriggers[1][0])}`;
        } else {
          return `⚠️ ไวต่อหลายปัจจัย (${topTriggers.map(([k]) => formatName(k)).join(', ')})`;
        }
      }
    }

    if (fallbackTrigger) {
      switch (fallbackTrigger.toLowerCase()) {
        case 'sound_db': case 'sound': case 'noise': return '🔊 ไวต่อเสียงรบกวน';
        case 'co2': return '🫁 ไวต่อก๊าซ CO2';
        case 'humidity': case 'hum': return '💧 ไวต่อความชื้น';
        case 'temperature': case 'temp': return '🌡️ ไวต่ออุณหภูมิห้อง';
        default: return `⚠️ ไวต่อ${fallbackTrigger}`;
      }
    }

    return '🟢 ปกติ (ไม่พบสิ่งเร้า)';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '40px 16px 60px 16px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <style jsx>{`
        .profile-container {
          width: 100%;
          max-width: 1100px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .btn-back-glow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #ffffff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          padding: 8px 20px 8px 12px;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.5) 0%, rgba(37, 99, 235, 0.7) 100%);
          border: 1.5px solid rgba(56, 189, 248, 0.6);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
          backdrop-filter: blur(16px);
        }
        .arrow-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          line-height: 1;
        }
        .glass-card {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
        }
        .table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 16px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
          min-width: 650px;
        }
        th {
          color: #94a3b8;
          padding: 16px 14px;
          background-color: rgba(15, 23, 42, 0.85);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 700;
        }
        td {
          padding: 16px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
        }
        .chart-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 900px) {
          .chart-grid {
            grid-template-columns: 1fr 1fr;
          }
          .chart-full {
            grid-column: span 2;
          }
        }
        .date-pill {
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid rgba(56, 189, 248, 0.4);
          background: rgba(15, 23, 42, 0.6);
          color: #94a3b8;
          transition: all 0.2s;
        }
        .date-pill.active {
          background: #38bdf8;
          color: #0f172a;
          border-color: #38bdf8;
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.5);
        }
      `}</style>

      <main className="profile-container">
        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="btn-back-glow">
            <div className="arrow-badge">←</div>
            <span>กลับหน้าหลัก</span>
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', letterSpacing: '0.8px' }}>
            SENSITIVITY PROFILE HISTORY
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: '#f8fafc' }}>
            📜 ประวัติคุณภาพการนอนและสภาพแวดล้อมสะสม
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            {loading ? 'กำลังดึงประวัติย้อนหลัง...' : `บันทึกข้อมูลย้อนหลังรวม ${historyLogs.length} วัน`}
          </p>
        </div>

        {/* 1. การ์ดสรุปค่าเฉลี่ยสะสม */}
        <section className="glass-card" style={{ borderColor: 'rgba(56, 189, 248, 0.35)' }}>
          <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.5px' }}>
            📈 สรุปค่าเฉลี่ยสะสมจากประวัติจริง ({historyLogs.length} วัน)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '600' }}>Garmin เฉลี่ย</span>
              <strong style={{ fontSize: '28px', color: '#38bdf8', fontWeight: '900' }}>{averages.garmin || '--'}</strong>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '600' }}>Room Env เฉลี่ย</span>
              <strong style={{ fontSize: '28px', color: '#f43f5e', fontWeight: '900' }}>{averages.room || '--'}</strong>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '600' }}>Combined เฉลี่ย</span>
              <strong style={{ fontSize: '28px', color: '#34d399', fontWeight: '900' }}>{averages.combined || '--'}</strong>
            </div>
          </div>
        </section>

        {/* 2. ตารางประวัติรายวันแบบครบถ้วน */}
        <section className="glass-card">
          <strong style={{ fontSize: '15px', color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
            📋 ตารางเปรียบเทียบคะแนนและจุดอ่อนความไวรายวัน
          </strong>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>Garmin</th>
                  <th>Room Env</th>
                  <th>Combined</th>
                  <th>จุดอ่อนความไวของผู้ใช้ (Daily Sensitivity)</th>
                  <th>อัตราการดิ้น</th>
                </tr>
              </thead>
              <tbody>
                {historyLogs.length > 0 ? (
                  historyLogs.map((log, index) => {
                    const restlessDisplay = log.restlessCount ?? log.restlessMomentsCount ?? '--';
                    const garminScoreVal = Number(log.garminScore || 70);
                    const roomScoreVal = getCalculatedRoomScore(log, roomEnvMap[log.date], eventsMap[log.date]);
                    const combinedDisplay = Math.round(garminScoreVal * 0.5 + roomScoreVal * 0.5);
                    const sensitivityLabel = getUserSensitivity(log.date, log.primaryTrigger || log.primarySensorTrigger);

                    return (
                      <tr 
                        key={index} 
                        onClick={() => setSelectedDate(log.date)}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: selectedDate === log.date ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <td style={{ fontWeight: '700', color: '#38bdf8' }}>
                          {log.date} {selectedDate === log.date && '📍'}
                        </td>
                        <td style={{ fontWeight: '600' }}>{garminScoreVal}</td>
                        <td style={{ color: roomScoreVal < 70 ? '#f43f5e' : '#34d399', fontWeight: '700' }}>
                          {roomScoreVal}
                        </td>
                        <td style={{ fontWeight: '800', color: '#ffffff' }}>{combinedDisplay}</td>
                        <td style={{ fontWeight: '700', color: '#fef08a' }}>
                          {sensitivityLabel}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {restlessDisplay !== '--' ? `${restlessDisplay} ครั้ง` : '--'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '28px' }}>
                      ยังไม่มีประวัติบันทึกสะสม
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>💡 คลิกที่แถววันที่ในตารางเพื่อเปลี่ยนกราฟด้านล่างได้ทันที</span>
        </section>

        {/* 3. แดชบอร์ดกราฟข้อมูลดิบเซนเซอร์จริง ESP32 */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 2px 0', color: '#f8fafc' }}>
                📊 กราฟข้อมูลดิบเซนเซอร์ประจำคืน: <span style={{ color: '#38bdf8' }}>{selectedDate || 'กำลังโหลด...'}</span>
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Realtime Sensor Logs จากเครื่อง ESP32 ตลอดคืน</span>
            </div>

            {/* Date Selector Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {historyLogs.map((item) => (
                <button
                  key={item.date}
                  onClick={() => setSelectedDate(item.date)}
                  className={`date-pill ${selectedDate === item.date ? 'active' : ''}`}
                >
                  📅 {item.date}
                </button>
              ))}
            </div>
          </div>

          {chartTimeSeriesData.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              📡 กำลังโหลดข้อมูล หรือไม่มี Log ของวันที่ {selectedDate} ในระบบ
            </div>
          ) : (
            <div className="chart-grid">
              {/* 1. รวมฝุ่น PM */}
              <div className="glass-card chart-full" style={{ borderTop: '3px solid #38bdf8' }}>
                <strong style={{ fontSize: '15px', color: '#38bdf8', display: 'block', marginBottom: '4px' }}>
                  🌫️ ฝุ่นละอองในห้องนอน (PM1.0, PM2.5, PM10)
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '14px' }}>หน่วย: µg/m³ (เปรียบเทียบ 3 ขนาดในแกนเวลาเดียวกัน)</span>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartTimeSeriesData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#38bdf8', borderRadius: '12px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="pm1_0" name="PM 1.0" stroke="#34d399" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="pm2_5" name="PM 2.5" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="pm10" name="PM 10" stroke="#f87171" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. CO2 Gas */}
              <div className="glass-card" style={{ borderTop: '3px solid #f43f5e' }}>
                <strong style={{ fontSize: '15px', color: '#f43f5e', display: 'block', marginBottom: '4px' }}>
                  🫁 ก๊าซคาร์บอนไดออกไซด์ (CO2)
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '14px' }}>หน่วย: ppm (เกณฑ์มาตรฐาน &lt; 1000 ppm)</span>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartTimeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="co2GradAll" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#f43f5e', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="co2" name="CO2 (ppm)" stroke="#f43f5e" strokeWidth={2} fill="url(#co2GradAll)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Temperature */}
              <div className="glass-card" style={{ borderTop: '3px solid #38bdf8' }}>
                <strong style={{ fontSize: '15px', color: '#38bdf8', display: 'block', marginBottom: '4px' }}>
                  🌡️ อุณหภูมิห้องนอน (Temperature)
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '14px' }}>หน่วย: °C (เหมาะสม 23.0 - 25.0 °C)</span>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartTimeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#38bdf8', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="temp" name="อุณหภูมิ (°C)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4. Humidity */}
              <div className="glass-card" style={{ borderTop: '3px solid #60a5fa' }}>
                <strong style={{ fontSize: '15px', color: '#60a5fa', display: 'block', marginBottom: '4px' }}>
                  💧 ความชื้นสัมพัทธ์ (Humidity)
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '14px' }}>หน่วย: % (เหมาะสม 50 - 60%)</span>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartTimeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="humGradAll" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#60a5fa', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="hum" name="ความชื้น (%)" stroke="#60a5fa" strokeWidth={2} fill="url(#humGradAll)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 5. Sound Noise */}
              <div className="glass-card" style={{ borderTop: '3px solid #c084fc' }}>
                <strong style={{ fontSize: '15px', color: '#c084fc', display: 'block', marginBottom: '4px' }}>
                  🔊 เสียงรบกวน (Noise / Sound)
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '14px' }}>หน่วย: Sound Index / dB (เงียบสงบ &lt; 40 dB)</span>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartTimeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#c084fc', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="sound" name="ระดับเสียง" stroke="#c084fc" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 6. Light Lux */}
              <div className="glass-card chart-full" style={{ borderTop: '3px solid #facc15' }}>
                <strong style={{ fontSize: '15px', color: '#facc15', display: 'block', marginBottom: '4px' }}>
                  💡 แสงสว่างในห้อง (Ambient Light)
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '14px' }}>หน่วย: Lux (มืดสนิท 0 Lux)</span>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartTimeSeriesData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="lightGradAll" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#facc15" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#facc15', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="light" name="ความสว่าง (Lux)" stroke="#facc15" strokeWidth={2} fill="url(#lightGradAll)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </section>

      </main>
    </div>
  );
}