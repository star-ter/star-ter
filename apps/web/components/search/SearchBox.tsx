'use client';

import { useRef, useEffect, useState } from 'react';
import { useMapStore } from '@/stores/useMapStore';
import { geocodeAddress } from '@/services/geocoding/geocoding.service';

export default function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { moveToLocation } = useMapStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async () => {
    if (!searchValue.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const result = await geocodeAddress(searchValue);
      if (result) {
        moveToLocation(
          { lat: result.lat, lng: result.lng },
          result.buildingName || result.address || searchValue,
          3,
          true, // centered: 정중앙에 표시
        );
        setSearchValue('');
        inputRef.current?.blur();
      } else {
        alert(`"${searchValue}"의 위치를 찾을 수 없습니다.`);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <header className="m-4 pointer-events-none">
      <div
        ref={containerRef}
        onClick={() => inputRef.current?.focus()}
        className="pointer-events-auto group flex h-12 w-12 hover:w-[320px] focus-within:w-[320px] items-center gap-3 rounded-full bg-white hover:bg-white focus-within:bg-white/90 shadow-lg ring-1 ring-gray-200 transition-all duration-500 ease-in-out overflow-hidden px-3 cursor-pointer"
      >
        <figure
          className="flex shrink-0 h-6 w-6 items-center justify-center text-gray-800 ml-0.4 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleSearch();
          }}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={`h-5 w-5 ${isSearching ? 'animate-pulse' : ''}`}
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
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="지역, 주소 또는 상권을 검색하세요.."
          className="w-full min-w-[240px] bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 delay-100"
        />
      </div>
    </header>
  );
}
