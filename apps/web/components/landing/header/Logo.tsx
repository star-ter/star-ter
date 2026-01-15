'use client';
import Link from 'next/link';

export function Logo({ className = 'h-8' }: { className?: string }) {
  return (
    <Link href="/locations">
      <div className={`flex items-center ${className}`}>
        <span className="text-2xl font-bold text-blue-900 logo-text">
          지리응답
        </span>
      </div>
    </Link>
  );
}
