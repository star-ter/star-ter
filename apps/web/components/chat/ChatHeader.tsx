"use client";

import { Search, Plus, ChevronDown, Map } from "lucide-react";

/**
 * ChatHeader 컴포넌트 - 채팅 페이지 상단 헤더
 *
 * Props 개념:
 * - 부모 컴포넌트(ChatPage)에서 데이터를 받아 렌더링
 * - threadTitle: 현재 스레드 제목
 * - onNewThread: 새 스레드 생성 콜백 함수
 *
 * 이벤트 핸들링:
 * - onClick={() => ...}: 클릭 이벤트 발생 시 콜백 실행
 */

interface ChatHeaderProps {
  threadTitle: string;
  onNewThread: () => void;
  isMapOpen?: boolean;      // 지도 패널 열림 상태
  onMapToggle?: () => void; // 지도 토글 콜백
}

export function ChatHeader({ threadTitle, onNewThread, isMapOpen, onMapToggle }: ChatHeaderProps) {
  return (
    <header className="h-20 border-b border-gray-100 flex items-center px-8 shrink-0">
      {/* 왼쪽: 모델 선택 + 스타일 선택 */}
      <div className="flex items-center gap-4 flex-1 justify-start min-w-0">
        {/* 모델 선택 드롭다운 (UI만) */}
        <button className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0">
          <div className="w-6 h-6 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
            <span className="text-xs text-white font-bold">AI</span>
          </div>
          <span className="text-base font-medium text-slate-700 hidden sm:inline">지리응답 AI</span>
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* 가운데: 스레드 제목 */}
      <div className="flex items-center gap-3 justify-center flex-shrink-0 mx-4">
        <span className="text-base font-medium text-slate-700 max-w-[200px] sm:max-w-sm truncate">
          {threadTitle}
        </span>
      </div>

      {/* 오른쪽: 지도, 검색, 새 스레드 */}
      <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
        {/* 지도 토글 버튼 */}
        {onMapToggle && (
          <button
            onClick={onMapToggle}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-base transition-colors whitespace-nowrap ${
              isMapOpen 
                ? "bg-blue-100 text-blue-700" 
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="hidden sm:inline">{isMapOpen ? "지도 닫기" : "지도 열기"}</span>
          </button>
        )}

        {/* 새 스레드 버튼 */}
        <button
          onClick={onNewThread}
          className="flex items-center gap-2.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-base font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">새 대화 생성</span>
        </button>
      </div>
    </header>
  );
}
