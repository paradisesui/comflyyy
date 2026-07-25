'use client';

import Link from 'next/link';

export default function PersonaPage() {
  const weights = [
    { name: 'เสียงรบกวน (Sound)', weight: 35, color: '#ef4444' },
    { name: 'อุณหภูมิ (Temperature)', weight: 25, color: '#f59e0b' },
    { name: 'คาร์บอนไดออกไซด์ (CO2)', weight: 20, color: '#10b981' },
    { name: 'ฝุ่น PM2.5', weight: 10, color: '#06b6d4' },
    { name: 'ความชื้น (Humidity)', weight: 5, color: '#6366f1' },
    { name: 'แสงสว่าง (Lux)', weight: 5, color: '#a855f7' },
  ];

  return (
    <main className="dashboard-container">
      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        
        {/* Header ย้อนกลับ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '32px' }}>
          <Link href="/" className="btn-secondary" style={{ width: 'auto', padding: '8px 16px', textDecoration: 'none', fontSize: '14px' }}>
            ← ย้อนกลับ
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
            ประวัติการใช้งาน & Persona
          </h1>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* AI Persona Diagnosis */}
        <div className="card-box" style={{ marginBottom: '24px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '32px' }}>🧬</span>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#34d399', margin: 0 }}>Personalized Sleep Persona</h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>วิเคราะห์สะสมจากการนอน 7-14 คืน</p>
            </div>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: '1.6', margin: 0, backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px' }}>
            คุณเป็นผู้ใช้กลุ่ม <strong style={{ color: '#34d399' }}>"Noise Sensitive" (ไวต่อเสียงรบกวน)</strong> จากสถิติพบว่า เมื่อระดับเสียงเพิ่มเกิน 1,200 ระดับการนอนของคุณจะเปลี่ยนจาก Deep Sleep เป็น Light Sleep ทันที
          </p>
        </div>

        {/* Weighted Bar */}
        <div className="card-box" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#f1f5f9', margin: '0 0 20px 0' }}>⚖️ ค่าน้ำหนักตัวแปรที่มีผลต่อการนอนของคุณ (Weight Table)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {weights.map((w, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                  <span style={{ color: '#cbd5e1' }}>{w.name}</span>
                  <span style={{ fontWeight: 'bold', color: '#ffffff' }}>{w.weight}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${w.weight}%`, height: '100%', backgroundColor: w.color, borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}