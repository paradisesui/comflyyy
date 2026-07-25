import './globals.css';

export const metadata = {
  title: 'Comflyyy - Quality Score',
  description: 'Room Quality Score Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-[#090d16] text-white min-h-screen flex flex-col justify-center items-center antialiased">
        {children}
      </body>
    </html>
  );
}