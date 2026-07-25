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
        boxSizing: 'border-box'
      }}
      className="flex items-center justify-center p-4 md:p-8 font-sans"
    >
      {/* Main Container Card */}
      <div 
        style={{
          backgroundColor: '#0f172a',
          borderColor: '#1e293b',
          borderRadius: '1.5rem',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
        className="w-full max-w-lg p-6 md:p-8 shadow-2xl flex flex-col space-y-6"
      >
        
        {/* Header ส่วนบนของการ์ด */}
        <div className="flex items-center justify-between w-full pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌙</span>
            <h1 className="font-bold text-lg text-slate-100 tracking-wide" style={{ margin: 0 }}>Comflyyy</h1>
          </div>
          
          <button 
            style={{ 
              backgroundColor: '#1e293b', 
              borderColor: '#334155',
              width: '40px',
              height: '40px'
            }}
            className="rounded-full border transition cursor-pointer flex items-center justify-center p-0 hover:bg-slate-700"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              style={{ color: '#cbd5e1' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>

        {/* Circle Score Display */}
        <div className="flex flex-col items-center justify-center my-2">
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg className="-rotate-90 transform" width="200" height="200" viewBox="0 0 100 100" style={{ width: '200px', height: '200px' }}>
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#1e293b"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#10b981"
                strokeWidth="7"
                strokeDasharray="263.89"
                strokeDashoffset="15"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-black text-white tracking-tight" style={{ fontWeight: 900, fontSize: '2.75rem' }}>97%</span>
              <span className="text-xs font-semibold tracking-widest mt-1 uppercase" style={{ color: '#94a3b8' }}>ROOM SCORE</span>
            </div>
          </div>

          {/* Level Label */}
          <div className="text-center mt-3">
            <p className="text-xs font-medium" style={{ color: '#94a3b8', margin: 0 }}>ระดับคุณภาพห้องนอน</p>
            <h2 className="text-2xl font-extrabold tracking-wide mt-1" style={{ color: '#34d399', fontWeight: 800, margin: 0 }}>{level}</h2>
          </div>
        </div>

        {/* AI Recommendation Box */}
        <div 
          style={{ 
            backgroundColor: '#162032', 
            borderColor: '#1e293b', 
            borderRadius: '1rem',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
          className="w-full p-4 text-sm leading-relaxed text-center"
        >
          <p className="font-semibold mb-1 flex items-center justify-center gap-1.5 text-slate-200" style={{ margin: 0, marginBottom: '6px' }}>
            <span>💡</span> คำแนะนำเฉพาะบุคคล
          </p>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.875rem' }}>{recommendation}</p>
        </div>

        {/* Footer Action Buttons */}
        <div className="w-full space-y-2.5 pt-2 flex flex-col gap-2.5">
          <button
            onClick={() => alert('ไปยังหน้าดูคะแนนเซนเซอร์และกราฟ')}
            style={{ 
              backgroundColor: '#10b981', 
              color: '#020617', 
              borderRadius: '0.75rem',
              padding: '12px 16px',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: 'bold'
            }}
            className="w-full transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-[0.99]"
          >
            <span>ดูคะแนนเพิ่มเติม</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={() => alert('ไปยังหน้าประวัติการใช้งานและข้อมูล Persona')}
            style={{ 
              backgroundColor: '#1e293b', 
              borderColor: '#334155', 
              color: '#e2e8f0', 
              borderRadius: '0.75rem',
              padding: '12px 16px',
              borderWidth: '1px',
              borderStyle: 'solid',
              fontSize: '0.95rem',
              fontWeight: 600
            }}
            className="w-full transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-700 active:scale-[0.99]"
          >
            <span>ประวัติการใช้งาน</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#94a3b8' }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

      </div>
    </main>
  );
}