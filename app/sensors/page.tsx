'use client';

import Link from 'next/link';

export default function SensorsPage() {
  const sensors = [
    { name: 'อุณหภูมิ (SHT31)', value: '27.99°C', status: 'เฝ้าระวัง', color: '#f59e0b', icon: '🌡️' },
    { name: 'ความชื้น (SHT31)', value: '57.57%', status: 'ปกติ', color: '#10b981', icon: '💧' },
    { name: 'ความสว่าง (TSL2591)', value: '68.7 Lux', status: 'สว่างไป', color: '#f59e0b', icon: '💡' },
    { name: 'คาร์บอนไดออกไซด์ (CO2)', value: '992 ppm', status: 'ปานกลาง', color: '#f59e0b', icon: '🍃' },
    { name: 'เสียงรบกวน (Microphone)', value: '1650', status: 'เงียบสงบ', color: '#10b981', icon: '🔊' },
    { name: 'ฝุ่น PM2.5 (PMS5003)', value: '1 µg/m³', status: 'ดีมาก', color: '#10b981', icon: '🌫️' },
  ];

  return (
    <main className="dashboard-container">
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        
        {/* Header ย้อนกลับ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <Link href="/" className="btn-secondary" style={{ width: 'auto', padding: '8px 16px', textDecoration: 'none', fontSize: '14px' }}>
            ← ย้อนกลับ
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
            คะแนนเซนเซอร์แต่ละตัว
          </h1>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* Sensor Grid (การ์ดเซนเซอร์ 6 ตัว) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {sensors.map((s, i) => (
            <div key={i} className="card-box" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '28px' }}>{s.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: s.color, backgroundColor: `${s.color}20`, padding: '4px 10px', borderRadius: '12px', border: `1px solid ${s.color}40` }}>
                  {s.status}
                </span>
              </div>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>{s.name}</p>
                <p style={{ color: '#ffffff', fontSize: '28px', fontWeight: 800, margin: '4px 0 0 0' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Box */}
        <div className="card-box" style={{ textAlign: 'center', padding: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#f1f5f9' }}>📊 กราฟพฤติกรรมสิ่งแวดล้อมตลอดคืน</h3>
          <div style={{ height: '180px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px border #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px' }}>
            [ Real-time Line Chart Data Timeline ]
          </div>
        </div>

      </div>
    </main>
  );
}