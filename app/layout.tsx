import './globals.css';

export const metadata = {
  title: 'Comflyyy - Room Score',
  description: 'Room Quality Score Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body 
        style={{ backgroundColor: '#090d16', margin: 0, padding: 0 }}
        className="min-h-screen w-full flex items-center justify-center font-sans"
      >
        {children}
      </body>
    </html>
  );
}