// app/components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-4 bg-slate-800 text-white shadow-md">
      <div className="text-xl font-bold text-blue-400">My App</div>
      <div className="space-x-4">
        <Link href="/" className="hover:text-blue-300 transition">หน้าแรก</Link>
        <Link href="/about" className="hover:text-blue-300 transition">เกี่ยวกับเรา</Link>
      </div>
    </nav>
  );
}