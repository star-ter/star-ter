'use client';
import Link from 'next/link';
import Image from 'next/image';
import LogoImg from '@/components/img/logo.png';

interface LogoProps {
  className?: string;
  width?: number;
}

export function Logo({ className = '', width = 120 }: LogoProps) {
  return (
    <Link href="/locations">
      <div className={`flex items-center ${className}`}>
        <Image
          src={LogoImg}
          alt="Alley Logo"
          width={width}
          style={{ width: `${width}px`, height: 'auto' }}
          className="object-contain"
        />
      </div>
    </Link>
  );
}
