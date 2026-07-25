'use client';

const level = "ดีเยี่ยม";
const recommendation = "สภาพแวดล้อมห้องนอนของคุณสมบูรณ์แบบมาก เหมาะแก่การหลับลึกอย่างมีประสิทธิภาพ";

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-[#0b0f19] text-white flex flex-col justify-between p-4 md:p-8 max-w-4xl mx-auto">
      
      {/* Header ส่วนโปรไฟล์ด้านบน */}
      <div className="w-full flex justify-end">
        <button className="bg-slate-800/80 p-2.5 rounded-full border border-slate-700/60 hover:bg-slate-700 transition shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex flex-col items-center justify-center space-y-6 md:space-y-8 my-auto py-6">
        
        {/* Circle Score Display */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-56 h-56 md:w-64 md:h-64 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-emerald-500"
                strokeWidth="8"
                strokeDasharray="263.89"
                strokeDashoffset="15"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-5xl md:text-6xl font-black text-white tracking-tight">97%</span>
              <span className="text-xs md:text-sm font-semibold tracking-widest text-slate-400 mt-1 uppercase">ROOM SCORE</span>
            </div>
          </div>
        </div>

        {/* Level Label */}
        <div className="text-center space-y-1">
          <p className="text-sm md:text-base text-slate-400 font-medium">ระดับคุณภาพห้องนอน</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-emerald-400 tracking-wide">{level}</h2>
        </div>

        {/* AI Recommendation Box */}
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 text-slate-300 text-sm md:text-base leading-relaxed shadow-xl text-center backdrop-blur-sm">
          <p className="font-semibold text-slate-200 mb-1.5 flex items-center justify-center gap-2">
            <span>💡</span> คำแนะนำเฉพาะบุคคล
          </p>
          <p className="text-slate-400">{recommendation}</p>
        </div>

      </div>

      {/* Footer Action Buttons */}
      <footer className="w-full max-w-xl mx-auto space-y-3 pt-4 pb-6">
        <button
          onClick={() => alert('ไปยังหน้าดูคะแนนเซนเซอร์และกราฟ')}
          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <span>ดูคะแนนเพิ่มเติม</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={() => alert('ไปยังหน้าประวัติการใช้งานและข้อมูล Persona')}
          className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <span>ประวัติการใช้งาน</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </button>
      </footer>

    </div>
  );
}