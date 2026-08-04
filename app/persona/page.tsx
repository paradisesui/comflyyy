'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PersonaPage() {
  const [sensitivity, setSensitivity] = useState({
    temperature: 'High',
    sound: 'High',
    light: 'Medium',
  });

  const [isWatchConnected, setIsWatchConnected] = useState<boolean>(true);
  const [simulatedArousal, setSimulatedArousal] = useState<string | null>(null);

  const handleSimulateSpike = () => {
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSimulatedArousal(`จำลองพบภาวะสะดุ้งตื่น (Heart Rate Spike: 88 bpm) ณ เวลา ${timeStr} น. บันทึกข้อมูลลง Firebase เรียบร้อย`);
  };

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

        .persona-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

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
          .persona-grid {
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
        }
      `}</style>

      <main className="persona-container">
        {/* Header */}
        <div className="header-box">
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }}>
            ← ย้อนกลับหน้าหลัก
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
            ตั้งค่า Smart Watch & Sleep Persona
          </h1>
        </div>

        {/* Persona Main Settings Grid */}
        <div className="persona-grid">
          {/* Smart Watch Connection Box */}
          <section style={{
            backgroundColor: '#162032',
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>⌚</span>
                <div>
                  <span style={{ fontSize: '16px', fontWeight: '700', display: 'block' }}>Smart Watch Sync</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {isWatchConnected ? 'พร้อมเชื่อมต่อ Garmin / Health API' : 'ปิดการเชื่อมต่อ'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsWatchConnected(!isWatchConnected)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: isWatchConnected ? '#10b98120' : '#334155',
                  color: isWatchConnected ? '#34d399' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {isWatchConnected ? '• Connected' : 'Connect'}
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.6' }}>
              เมื่อได้รับ Garmin API ระบบจะดึงค่าอัตราการเต้นของหัวใจ (Heart Rate) และภาวะสะดุ้งตื่น (Sleep Arousal) มาจับคู่เวลา Timestamp กับค่าเซนเซอร์ในห้องนอนโดยอัตโนมัติ
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: 0 }} />

            {/* Test Simulation Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>🧪 ทดสอบระบบส่งค่าจำลอง (Demo Test)</span>
              <button
                onClick={handleSimulateSpike}
                style={{
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ⚡ จำลองตรวจพบภาวะสะดุ้งตื่น (Simulate Spike)
              </button>
              {simulatedArousal && (
                <div style={{ fontSize: '12px', color: '#34d399', backgroundColor: '#10b98115', padding: '10px', borderRadius: '10px', border: '1px solid #10b98130' }}>
                  {simulatedArousal}
                </div>
              )}
            </div>
          </section>

          {/* Personal Sensitivity Settings */}
          <section style={{
            backgroundColor: '#162032',
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{ fontSize: '15px', color: '#38bdf8', margin: 0, fontWeight: '700' }}>
              🎯 ระดับความไวต่อสิ่งรบกวนเฉพาะบุคคล
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              ปรับระดับการตอบสนองของร่างกาย เพื่อให้ Gemini AI คำนวณคำแนะนำได้อย่างแม่นยำยิ่งขึ้น
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>🌡️ ตื่นง่ายเมื่อร้อน/อุ่น</span>
                <select
                  value={sensitivity.temperature}
                  onChange={(e) => setSensitivity({ ...sensitivity, temperature: e.target.value })}
                  style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '10px', padding: '6px 12px', fontSize: '12px' }}
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
                  style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '10px', padding: '6px 12px', fontSize: '12px' }}
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
                  style={{ backgroundColor: '#0f172a', color: '#34d399', border: '1px solid #334155', borderRadius: '10px', padding: '6px 12px', fontSize: '12px' }}
                >
                  <option value="High">ไวมาก (High)</option>
                  <option value="Medium">ปานกลาง</option>
                  <option value="Low">ทนได้ดี</option>
                </select>
              </div>
            </div>
          </section>
        </div>

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