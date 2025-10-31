import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { ParticleBackground } from '@/components/ui/particle-background';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Persian Garden Explorer',
  description: 'An intelligent research application for exploring the history and design of Persian Gardens.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
         <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhpmA9dtpgBcbL_xjUTk/l8Iu9k9lEYfSASo="
          crossOrigin=""/>
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <ParticleBackground />
        <div className="relative z-10 flex flex-col h-screen">
          <main className="flex-grow flex-shrink-0 flex overflow-y-auto">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
