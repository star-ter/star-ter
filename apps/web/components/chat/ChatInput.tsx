'use client';

import { Paperclip, Send } from 'lucide-react';

/**
 * ChatInput 컴포넌트 - 메시지 입력 영역
 *
 * Controlled Component 개념:
 * - React에서 폼 요소의 값을 state로 관리
 * - value={value}: 입력값을 state와 동기화
 * - onChange: 입력 변경 시 state 업데이트
 *
 * 이벤트 핸들러 패턴:
 * - onKeyDown: 키보드 이벤트 감지 (Enter 키로 전송)
 * - e.preventDefault(): 기본 동작(줄바꿈) 방지
 */

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
}: ChatInputProps) {
  // Enter 키로 메시지 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // 줄바꿈 방지
      if (!isLoading) {
        onSend();
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-4 rounded-3xl border border-border px-2 py-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 transition-all">
        {/* 텍스트 입력 영역 */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="무엇이든 물어보세요..."
          className="flex-1 bg-transparent text-h5 text-foreground placeholder-muted-foreground resize-none focus:outline-none max-h-52 py-3 ml-4 no-scrollbar"
          rows={1}
          disabled={isLoading}
        />

        {/* 전송 버튼 */}
        <button
          type="button"
          onClick={onSend}
          disabled={isLoading || !value.trim()}
          className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
