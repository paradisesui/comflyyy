'use client';

export default function Home() {
  const level = "ดีเยี่ยม";
  const recommendation = "สภาพแวดล้อมห้องนอนของคุณสมบูรณ์แบบมาก เหมาะแก่การหลับลึกอย่างมีประสิทธิภาพ";

  return (
    <main className="dashboard-container">
      <div>
        {/* Header ส่วนบน */}
        <header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🌙</span>
            <h1 style={{ fontWeight: 'bold', fontSize: '24px', color: '#f8fafc', margin: 0 }}>
              Comflyyy
            </h1>
          </div>
          
          <button 
            style={{ 
              backgroundColor: '#1e293b', 
              borderColor: '#334155',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              borderWidth: '1px',
              borderStyle: 'solid',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#cbd5e1' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </header>

        {/* Dashboard Content แบ่ง 2 ฝั่ง */}
        <div className="dashboard-grid">
          
          {/* ฝั่งซ้าย: วงกลมคะแนน */}
          <div className="card-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg transform="rotate(-90)" width="240" height="240" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="7.5" fill="transparent" />
                <circle cx="50" cy="50" r="42" stroke="#10b981" strokeWidth="7.5" strokeDasharray="263.89" strokeDashoffset="15" strokeLinecap="round" fill="transparent" />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontWeight: 900, fontSize: '56px', color: '#ffffff', lineHeight: 1 }}>97%</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', letterSpacing: '2px', marginTop: '4px' }}>ROOM SCORE</span>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>ระดับคุณภาพห้องนอน</p>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#34d399', margin: '6px 0 0 0' }}>{level}</h2>
            </div>
          </div>

          {/* ฝั่งขวา: คำแนะนำ + ปุ่มกด */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Box คำแนะนำ */}
            <div className="card-box">
              <p style={{ fontWeight: 600, fontSize: '18px', color: '#f1f5f9', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💡</span> คำแนะนำเฉพาะบุคคล
              </p>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '16px', lineHeight: '1.6.5' }}>{recommendation}</p>
            </div>

            {/* กลุ่มปุ่มกด */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button onClick={() => alert('ไปยังหน้าดูคะแนนเซนเซอร์และกราฟ')} className="btn-primary">
                <span>ดูคะแนนเพิ่มเติม</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              <button onClick={() => alert('ไปยังหน้าประวัติการใช้งานและข้อมูล Persona')} className="btn-secondary">
                <span>ประวัติการใช้งาน</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#94a3b8' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}