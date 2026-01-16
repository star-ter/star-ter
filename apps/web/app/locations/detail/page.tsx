'use client';

import { getLastViewed } from '@/hooks/useLocationHistory';
import { History } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    // 1. getLastViewed()로 마지막 조회 코드 가져오기
    const lastCode = getLastViewed();

    // 2. 코드가 있으면 해당 상세 페이지로 redirect
    if (lastCode) {
      router.replace(`/locations/detail/${lastCode}`);
    }
  }, [router]);

  // 히스토리 없을 때 표시할 UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* 아이콘 */}
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6">
        <History className="w-20 h-20 text-gray-500" />
      </div>
      {/* 타이틀 */}
      <h1 className="text-h3 font-bold text-gray-500 mb-2">
        조회 기록이 없습니다
      </h1>
      {/* 설명 */}
      <p className="text-body text-gray-500 mb-8">
        상권 목록에서 상권을 선택해주세요
      </p>

      {/* 버튼 */}
      <Link
        href="/locations/search"
        className="px-6 py-3 bg-slate-200 text-gray-500 rounded-xl text-body font-bold transition-colors"
      >
        상권 찾기로 이동
      </Link>
    </div>
  );
}
