'use client';

export default function Home() {
  const level = "ดีเยี่ยม";
  const recommendation = "สภาพแวดล้อมห้องนอนของคุณสมบูรณ์แบบมาก เหมาะแก่การหลับลึกอย่างมีประสิทธิภาพ";

  return (
    <main 
      style={{
        backgroundColor: '#090d16',
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif'
      }}
    >
      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
        
        {/* Header ส่วนบนสุด */}
        <header 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            paddingBottom: '20px', 
            borderBottom: '1px solid #1e293b',
            marginBottom: '40px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🌙</span>
            <h1 style={{ fontWeight: 'bold', fontSize: '24px', color: '#f8fafc', margin: 0, tracking: '0.05em' }}>
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

        {/* Layout แบ่ง 2 ฝั่ง (ซ้าย-ขวา) บนจอคอม */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '32px',
            alignItems: 'center'
          }}
        >
          
          {/* ฝั่งซ้าย: วงกลมแสดงคะแนน */}
          <div 
            style={{
              backgroundColor: '#0f172a',
              borderColor: '#1e293b',
              borderRadius: '24px',
              borderWidth: '1px',
              borderStyle: 'solid',
              padding: '40px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ position: 'relative', width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg transform="rotate(-90)" width="240" height="240" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="7.5" fill="transparent" />
                <circle cx="50" cy="50" r="42" stroke="#10b981" strokeWidth="7.5" strokeDasharray="263.89" strokeDashoffset="15" strokeLinecap="round" fill="transparent" />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontWeight: 900, fontSize: '56px', color: '#ffffff', leading: 1 }}>97%</span>
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
            <div 
              style={{ 
                backgroundColor: '#0f172a', 
                borderColor: '#1e293b', 
                borderRadius: '24px',
                borderWidth: '1px',
                borderStyle: 'solid',
                padding: '28px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
              }}
            >
              <p style={{ fontWeight: 600, fontSize: '18px', color: '#f1f5f9', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💡</span> คำแนะนำเฉพาะบุคคล
              </p>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '16px', lineHeight: '1.6' }}>{recommendation}</p>
            </div>

            {/* กล่องปุ่มกด (มีระยะห่างปุ่ม 16px ชัดเจน) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* ปุ่มดูคะแนนเพิ่มเติม */}
              <button
                onClick={() => alert('ไปยังหน้าดูคะแนนเซนเซอร์และกราฟ')}
                style={{ 
                  backgroundColor: '#10b981', 
                  color: '#020617', 
                  borderRadius: '16px',
                  padding: '18px 24px',
                  border: 'none',
                  fontSize: '17px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.3)'
                }}
              >
                <span>ดูคะแนนเพิ่มเติม</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* ปุ่มประวัติการใช้งาน */}
              <button
                onClick={() => alert('ไปยังหน้าประวัติการใช้งานและข้อมูล Persona')}
                style={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  color: '#f8fafc', 
                  borderRadius: '16px',
                  padding: '18px 24px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  fontSize: '17px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
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