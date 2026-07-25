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
      className="flex flex-col justify-between p-6 md:p-12 font-sans max-w-6xl mx-auto"
    >
      {/* Header ส่วนบนสุด */}
      <header className="flex items-center justify-between w-full pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌙</span>
          <h1 className="font-bold text-2xl text-slate-100 tracking-wide" style={{ margin: 0 }}>
            Comflyyy
          </h1>
        </div>
        
        <button 
          style={{ 
            backgroundColor: '#1e293b', 
            borderColor: '#334155',
            width: '44px',
            height: '44px',
            borderRadius: '9999px',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
          className="transition cursor-pointer flex items-center justify-center p-0 hover:bg-slate-700"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="22" 
            height="22" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            style={{ color: '#cbd5e1', width: '22px', height: '22px' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </header>

      {/* Main Grid Content - แบ่งฝั่งซ้าย/ขวา สวยงามบนคอมพิวเตอร์ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto py-8 items-center">
        
        {/* Left Side: Score Display */}
        <div 
          style={{
            backgroundColor: '#0f172a',
            borderColor: '#1e293b',
            borderRadius: '1.5rem',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
          className="p-8 shadow-xl flex flex-col items-center justify-center text-center"
        >
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="-rotate-90 transform" width="240" height="240" viewBox="0 0 100 100" style={{ width: '240px', height: '240px' }}>
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#1e293b"
                strokeWidth="7.5"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="#10b981"
                strokeWidth="7.5"
                strokeDasharray="263.89"
                strokeDashoffset="15"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-6xl font-black text-white tracking-tight" style={{ fontWeight: 900, fontSize: '3.5rem' }}>97%</span>
              <span className="text-xs font-semibold tracking-widest mt-1 uppercase" style={{ color: '#94a3b8' }}>ROOM SCORE</span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium" style={{ color: '#94a3b8', margin: 0 }}>ระดับคุณภาพห้องนอน</p>
            <h2 className="text-3xl font-extrabold tracking-wide mt-1" style={{ color: '#34d399', fontWeight: 800, margin: 0 }}>{level}</h2>
          </div>
        </div>

        {/* Right Side: AI Box & Action Buttons */}
        <div className="flex flex-col space-y-6 justify-center">
          
          {/* Recommendation */}
          <div 
            style={{ 
              backgroundColor: '#0f172a', 
              borderColor: '#1e293b', 
              borderRadius: '1.5rem',
              borderWidth: '1px',
              borderStyle: 'solid'
            }}
            className="p-6 text-left shadow-xl"
          >
            <p className="font-semibold mb-2 flex items-center gap-2 text-slate-100 text-lg" style={{ margin: 0, marginBottom: '8px' }}>
              <span>💡</span> คำแนะนำเฉพาะบุคคล
            </p>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '1rem', leading: '1.6' }}>{recommendation}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 flex flex-col gap-3">
            <button
              onClick={() => alert('ไปยังหน้าดูคะแนนเซนเซอร์และกราฟ')}
              style={{ 
                backgroundColor: '#10b981', 
                color: '#020617', 
                borderRadius: '0.875rem',
                padding: '16px 20px',
                border: 'none',
                fontSize: '1.05rem',
                fontWeight: 'bold'
              }}
              className="w-full transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-[0.99]"
            >
              <span>ดูคะแนนเพิ่มเติม</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={() => alert('ไปยังหน้าประวัติการใช้งานและข้อมูล Persona')}
              style={{ 
                backgroundColor: '#0f172a', 
                borderColor: '#334155', 
                color: '#e2e8f0', 
                borderRadius: '0.875rem',
                padding: '16px 20px',
                borderWidth: '1px',
                borderStyle: 'solid',
                fontSize: '1.05rem',
                fontWeight: 600
              }}
              className="w-full transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-800 active:scale-[0.99]"
            >
              <span>ประวัติการใช้งาน</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#94a3b8' }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

        </div>

      </div>
    </main>
  );
}