'use client';

import { useActionState, useState, useCallback, useEffect } from 'react';
import { Sparkles, BarChart3, Store, ArrowUp } from 'lucide-react';
import { sendMessageAction } from '@/actions/chat';

/**
 * AI Chat Sidebar Component
 * - Styled via Tailwind Utility Classes (Inline)
 */
export default function AIChatSidebar() {
  const [state, formAction, isPending] = useActionState(sendMessageAction, {
    messages: [],
  });

  // Resizing Logic
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth > 320 && newWidth < 800) {
          setWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      // Fix issues: Text selection and cursor reset
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';

      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      // Cleanup styles
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <aside
      style={{ width: `${width}px` }}
      className="fixed top-0 right-0 z-50 flex h-screen flex-col border-l border-gray-200 bg-gray-200 shadow-xl transition-transform duration-300"
    >
      {/* Resizer Handle (Wider hit area with visible line) */}
      <div
        className="group absolute -left-3 top-0 z-50 flex h-full w-6 cursor-ew-resize justify-center bg-transparent"
        onMouseDown={startResizing}
      >
        <div className="h-full w-1 transition-colors group-hover:bg-blue-400/50 group-active:bg-blue-600" />
      </div>

      {/* Header */}
      <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" fill="currentColor" />
          <h2 className="text-lg font-semibold text-gray-800">AI Coach</h2>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {/* Messages */}
        {state.messages && state.messages.length > 0 ? (
          <div className="space-y-4">
            {state.messages.map((msg: any, idx: number) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex justify-start">
                <div className="flex space-x-1 rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Greeting & Suggestions*/
          <>
            <div className="mt-10 mb-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100/50 text-blue-600">
                <Sparkles className="h-8 w-8" fill="currentColor" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                안녕하세요, 사장님
                <br />
                무엇을 도와드릴까요?
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button className="group flex flex-col items-start rounded-xl border border-gray-300 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-500 hover:bg-blue-50/100 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500 group-hover:text-blue-600">
                  <BarChart3 className="h-4 w-4" />
                  <span>매출 요약</span>
                </div>
                <p className="text-sm text-gray-700">
                  이 입지에서 <span className="font-bold text-blue-600">치킨집</span>의 평균 매출을 요약해서 정리해줘
                </p>
              </button>

              <button className="group flex flex-col items-start rounded-xl border border-gray-300 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-500 hover:bg-blue-50/100 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500 group-hover:text-blue-600">
                  <Store className="h-4 w-4" />
                  <span>업종 / 메뉴 추천</span>
                </div>
                <p className="text-sm text-gray-700">
                  이 상권에서 <span className="font-bold text-blue-600">잘 맞는 업종 5개</span>를 추천하고, 체인점 설명해줘
                </p>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-200">
        <form action={formAction} className="relative group">
          <textarea
            name="message"
            placeholder="AI Coach에 메시지 보내기"
            className="w-full resize-none rounded-2xl border border-gray-300 bg-white p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-200 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-300 ease-in-out h-14 pb-3 group-focus-within:h-32 group-focus-within:pb-12"
            rows={undefined}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                (e.currentTarget.form as HTMLFormElement).requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            disabled={isPending}
            className="absolute right-3 bottom-3 flex items-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-xs font-medium text-white transition-opacity hover:bg-gray-800 disabled:opacity-50 opacity-0 pointer-events-none duration-100 group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:duration-300"
          >
            질문하기
            <ArrowUp className="h-3 w-3" />
          </button>
        </form>
      </div>
    </aside>
  );
}
