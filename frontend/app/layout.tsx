import './globals.css';
import { Nav } from '@/components/nav';

export const metadata = {
  title: 'Trend Money',
  description: 'Investment portfolio platform'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
