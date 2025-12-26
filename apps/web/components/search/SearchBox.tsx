'use client';

import { useRef } from 'react';

export default function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="flex flex-start w-screen px-4 py-4 pointer-events-none">
      <div 
        onClick={() => inputRef.current?.focus()}
        className="pointer-events-auto group flex h-12 w-12 hover:w-[320px] focus-within:w-[320px] items-center gap-3 rounded-full bg-white/50 hover:bg-white/90 focus-within:bg-white/90 shadow-lg ring-1 ring-gray-200 transition-all duration-500 ease-in-out overflow-hidden px-3 cursor-pointer"
      >
        <figure className="flex shrink-0 h-6 w-6 items-center justify-center text-gray-800 ml-0.4">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </figure>
        <input
          ref={inputRef}
          type="text"
          placeholder="지역, 주소 또는 상권을 검색하세요.."
          className="w-full min-w-[240px] bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 delay-100"
        />
      </div>
    </header>
  );
}
