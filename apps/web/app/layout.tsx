import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AIChatSidebar from '@/components/features/chat/AIChatSidebar';
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'star-ter: 명당을 찾아주는 상권분석 서비스',
  description:
    '지도 기반 상권 데이터로 내 점포의 명당을 빠르게 찾는 맞춤 분석 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <AIChatSidebar />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
