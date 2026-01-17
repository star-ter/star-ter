'use client';

import { RecommendSection } from '@/components/location-main-page/RecommendSection';
import { TrendingSection } from '@/components/location-main-page/TrendingSection';
import { AverageSalesSection } from '@/components/location-main-page/AverageSalesSection';
import { useUserStore } from '@/store/use-user-store';
import { useRef, useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

export function LocationListPage() {
  const { authUser } = useUserStore();
  const [chatInput, setChatInput] = useState('');
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = chatInputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const minHeight = 24;
    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      200,
    );
    textarea.style.height = `${nextHeight}px`;
  }, [chatInput]);

  return (
    <div className="flex flex-1 flex-col h-full bg-background rounded-2xl shadow-lg border border-border overflow-hidden no-scrollbar relative">
      {/* 본문 콘텐츠 컨테이너 - 채팅바 공간 확보를 위해 pb-32 추가 */}
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {/* 인사말 헤더 + 검색 */}
        <div className="px-8 pt-6 pb-4 shrink-0">
          <h1 className="text-h1 font-heading text-slate-900 mb-1">
            안녕하세요, {authUser?.nickname ? `${authUser.nickname}님` : '사장님'}
          </h1>
          <p className="text-h5 text-slate-400 mb-4">
            오늘은 어떤 상권을 찾고 계신가요?
          </p>
        </div>

        {/* 섹션들 */}
        <RecommendSection />
        <AverageSalesSection />
        <TrendingSection />
      </div>

      {/* 플로팅 채팅 입력창 */}
      <div
        className="absolute bottom-8 z-20 w-[min(320px,90vw)] md:w-[min(600px,90vw)] left-1/2 -translate-x-1/2 transition-all duration-300"
      >
        <div className="relative rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-xl">
          <textarea
            ref={chatInputRef}
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="무엇이든 물어보세요"
            rows={1}
            className="w-full min-h-[24px] resize-none bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none leading-6 pr-14"
            aria-label="채팅 입력"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                // TODO: 채팅 전송 로직 구현
              }
            }}
          />
          <button
            type="button"
            className="absolute right-4 bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white hover:bg-slate-800 transition-colors"
            aria-label="전송"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

