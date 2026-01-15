'use client';

// import { Logo } from '@/components/landing/header/Logo';
import authBg from './img/auth_bg.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center font-sans gap-8 bg-[url('/auth_bg.png')] bg-cover bg-center bg-no-repeat">
      <ImageWithFallback
        src={authBg.src}
        alt="배경"
        className="w-screen h-screen relative"
      ></ImageWithFallback>
      {/* <Logo className="mb-0" /> */}
      <div className="absolute w-full max-w-[480px] bg-white rounded-[32px] shadow-2xl p-12 md:p-8">
        {children}
      </div>
    </div>
  );
}
