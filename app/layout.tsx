import Navbar from './components/Navbar';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-slate-900 text-slate-100 min-h-screen flex flex-col">
        {/* ใส่ Navbar ตรงนี้ จะได้แสดงผลทุกหน้า */}
        <Navbar />
        
        {/* children คือเนื้อหาของแต่ละหน้า (เช่น page.tsx) */}
        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}