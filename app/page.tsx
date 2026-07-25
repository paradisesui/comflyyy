'use client';

export default function Home() {
  const level = "ดีเยี่ยม";
  const recommendation = "สภาพแวดล้อมห้องนอนของคุณสมบูรณ์แบบมาก เหมาะแก่การหลับลึกอย่างมีประสิทธิภาพ";

  return (
    <div 
      style={{ 
        backgroundColor: '#0b0f19', 
        color: '#ffffff', 
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box'
      }}
      className="flex flex-col justify-between p-4 md:p-8 max-w-4xl mx-auto font-sans"
    >
      
      {/* Header ส่วนโปรไฟล์ด้านบน */}
      <div className="w-full flex justify-end pt-2">
        <button 
          style={{ 
            backgroundColor: '#1e293b', 
            borderColor: '#334155',
            width: '44px',
            height: '44px'
          }}
          className="rounded-full border transition cursor-pointer flex items-center justify-center p-0"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            style={{ color: '#cbd5e1', width: '24px', height: '24px' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex flex-col items-center justify-center my-auto py-6 space-y-6 text-center">
        
        {/* Circle Score Display */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-56 h-56 md:w-64 md:h-64 flex items-center justify-center">
            <svg className="-rotate-90 transform" width="220" height="220" viewBox="0 0 100 100" style={{ width: '220px', height: '220px' }}>
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#1e293b"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#10b981"
                strokeWidth="8"
                strokeDasharray="263.89"
                strokeDashoffset="15"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-5xl md:text-6xl font-black text-white tracking-tight" style={{ fontWeight: 900, fontSize: '3rem' }}>97%</span>
              <span className="text-xs md:text-sm font-semibold tracking-widest mt-1 uppercase" style={{ color: '#94a3b8', fontSize: '0.875rem' }}>ROOM SCORE</span>
            </div>
          </div>
        </div>

        {/* Level Label */}
        <div className="text-center space-y-1">
          <p className="text-sm md:text-base font-medium" style={{ color: '#94a3b8' }}>ระดับคุณภาพห้องนอน</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide" style={{ color: '#34d399', fontWeight: 800, fontSize: '2rem' }}>{level}</h2>
        </div>

        {/* AI Recommendation Box */}
        <div 
          style={{ 
            backgroundColor: '#0f172a', 
            borderColor: '#1e293b', 
            borderRadius: '1rem',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
          className="w-full max-w-xl p-5 md:p-6 text-sm md:text-base leading-relaxed text-center shadow-xl"
        >
          <p className="font-semibold mb-2 flex items-center justify-center gap-2" style={{ color: '#e2e8f0', fontWeight: 600 }}>
            <span>💡</span> คำแนะนำเฉพาะบุคคล
          </p>
          <p style={{ color: '#94a3b8', margin: 0 }}>{recommendation}</p>
        </div>

      </div>

      {/* Footer Action Buttons */}
      <footer className="w-full max-w-xl mx-auto space-y-3 pb-6 flex flex-col gap-3">
        <button
          onClick={() => alert('ไปยังหน้าดูคะแนนเซนเซอร์และกราฟ')}
          style={{ 
            backgroundColor: '#10b981', 
            color: '#020617', 
            borderRadius: '0.75rem',
            padding: '14px 16px',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
          className="w-full transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>ดูคะแนนเพิ่มเติม</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ width: '20px', height: '20px' }}>
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={() => alert('ไปยังหน้าประวัติการใช้งานและข้อมูล Persona')}
          style={{ 
            backgroundColor: '#0f172a', 
            borderColor: '#334155', 
            color: '#e2e8f0', 
            borderRadius: '0.75rem',
            padding: '14px 16px',
            borderWidth: '1px',
            borderStyle: 'solid',
            fontSize: '1rem',
            fontWeight: 600
          }}
          className="w-full transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>ประวัติการใช้งาน</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#94a3b8', width: '20px', height: '20px' }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </button>
      </footer>

    </div>
  );
}