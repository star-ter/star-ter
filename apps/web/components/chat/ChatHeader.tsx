'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, Map } from 'lucide-react';

/**
 * ChatHeader 컴포넌트 - 채팅 페이지 상단 헤더
 *
 * Props 개념:
 * - 부모 컴포넌트(ChatPage)에서 데이터를 받아 렌더링
 * - threadTitle: 현재 스레드 제목
 * - onNewThread: 새 스레드 생성 콜백 함수
 * - aiProvider: 현재 선택된 AI 프로바이더 ('claude' | 'openai')
 * - onAiProviderChange: AI 프로바이더 변경 콜백
 */

// AI 프로바이더 타입 정의
export type AiProvider = 'openai' | 'claude';

interface ChatHeaderProps {
  threadTitle: string;
  onNewThread: () => void;
  isMapOpen?: boolean;
  onMapToggle?: () => void;
  aiProvider?: AiProvider;
  onAiProviderChange?: (provider: AiProvider) => void;
}

// Claude 아이콘 (텍스트 기반)
const ClaudeIcon = () => (
  <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-orange-600 rounded text-[10px] font-bold text-white flex items-center justify-center">
    AI
  </div>
);

// OpenAI 로고 SVG
const OpenAIIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .510 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
);

// AI 프로바이더 옵션 (SVG 컴포넌트 사용)
const AI_PROVIDERS = [
  { id: 'openai' as const, name: 'OpenAI', Icon: OpenAIIcon },
  { id: 'claude' as const, name: 'Claude', Icon: ClaudeIcon },
];

export function ChatHeader({
  threadTitle,
  onNewThread,
  isMapOpen,
  onMapToggle,
  aiProvider = 'claude',
  onAiProviderChange,
}: ChatHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentProvider =
    AI_PROVIDERS.find((p) => p.id === aiProvider) || AI_PROVIDERS[0];

  return (
    <header className="h-20 border-b border-border flex items-center px-8 shrink-0">
      {/* 왼쪽: AI 프로바이더 선택 드롭다운 */}
      <div className="flex items-center gap-4 flex-1 justify-start min-w-0">
        <div className="relative" ref={dropdownRef}>
          {(() => {
            const CurrentIcon = currentProvider.Icon;
            return (
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-muted transition-colors shrink-0"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <CurrentIcon />
                </div>
                <span className="text-body font-medium text-foreground hidden sm:inline">
                  {currentProvider.name}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
            );
          })()}

          {/* 드롭다운 메뉴 */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-background rounded-xl shadow-lg border border-border py-2 z-50">
              {AI_PROVIDERS.map((provider) => {
                const IconComponent = provider.Icon;
                return (
                  <button
                    key={provider.id}
                    onClick={() => {
                      onAiProviderChange?.(provider.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors ${
                      aiProvider === provider.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <IconComponent />
                    </div>
                    <span className="text-body font-medium text-foreground">
                      {provider.name}
                    </span>
                    {aiProvider === provider.id && (
                      <span className="ml-auto text-primary text-caption">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 가운데: 스레드 제목 */}
      <div className="flex items-center gap-3 justify-center shrink-0 mx-4">
        <span className="text-body font-medium text-foreground max-w-[200px] sm:max-w-sm truncate">
          {threadTitle}
        </span>
      </div>

      {/* 오른쪽: 지도, 새 스레드 */}
      <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
        {/* 지도 토글 버튼 */}
        {onMapToggle && (
          <button
            onClick={onMapToggle}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-body transition-colors whitespace-nowrap ${
              isMapOpen
                ? 'text-primary hover:text-muted-foreground'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="hidden sm:inline">
              {isMapOpen ? '지도 닫기' : '지도 열기'}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
