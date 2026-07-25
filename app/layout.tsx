import Navbar from './components/Navbar';
import './globals.css';

export const metadata = {
  title: 'Comflyyy',
  description: 'Room Quality Score',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-[#0b0f19] text-white min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1 w-full flex flex-col items-center justify-center">
          {children}
        </main>
      </body>
    </html>
  );
}