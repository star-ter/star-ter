"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatHeader } from "./ChatHeader";
import { SourceCard } from "./SourceCard";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatMapSection, type ChatMapSectionRef } from "./ChatMapSection";
import { ChatWelcome } from "./ChatWelcome";

import { useSearchParams, useRouter } from "next/navigation";
import { useChat } from "./hooks/useChat";
import { useActionDispatcher } from "./hooks/useActionDispatcher";
import { useUserStore } from "@/store/use-user-store";

/**
 * ChatPage 컴포넌트 - AI 챗봇의 메인 페이지
 */
export function ChatPage() {
  // 로그인된 사용자 ID 가져오기 (개인화 추천에 사용)
  const authUser = useUserStore((state) => state.authUser);

  // 커스텀 훅으로 로직 분리 (userId 전달)
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    currentThread,
    sendMessage,
    handleNewThread,
  } = useChat(authUser?.id);

  const [isMapOpen, setIsMapOpen] = useState(false);

  // 지도 섹션 참조 (액션 실행용)
  const mapSectionRef = useRef<ChatMapSectionRef>(null);

  // 스크롤 컨테이너 참조
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지 추가 시 스크롤 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Action Dispatcher Hook 사용
  const { dispatch } = useActionDispatcher(mapSectionRef, setIsMapOpen);

  // 메시지 전송 래퍼 (액션 처리 콜백 전달)
  const handleSendMessageWrapper = useCallback(
    (text?: string) => {
      const messageText = typeof text === "string" ? text : inputValue.trim();
      // useChat의 sendMessage에 dispatch 함수를 전달
      sendMessage(messageText, dispatch);
    },
    [inputValue, sendMessage, dispatch]
  );

  // TODO: 메인에서 검색제거 시 반드시 제거 
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasAutoSent = useRef(false);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query && !hasAutoSent.current) {
      hasAutoSent.current = true;
      setTimeout(() => {
        handleSendMessageWrapper(query);
        router.replace("/chat");
      }, 500);
    }
  }, [searchParams, router, handleSendMessageWrapper]);

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* 지도 영역 (왼쪽) */}
      <ChatMapSection ref={mapSectionRef} isOpen={isMapOpen} />

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
        <ChatHeader
          threadTitle={currentThread.title}
          onNewThread={handleNewThread}
          isMapOpen={isMapOpen}
          onMapToggle={() => setIsMapOpen(!isMapOpen)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar">
            <div className="max-w-5xl mx-auto space-y-8">
              {messages.length === 0 ? (
                <ChatWelcome onSuggestionClick={handleSendMessageWrapper} />
              ) : (
                messages.map((message) => (
                  <div key={message.id}>
                    {message.role === "assistant" && message.sources && (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          {/* SVG Icon omitted for brevity, logic preserved */}
                          <svg
                            className="w-6 h-6 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          <span className="text-base font-medium text-slate-600">
                            Sources
                          </span>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                          {message.sources.map((source) => (
                            <SourceCard key={source.id} source={source} />
                          ))}
                        </div>
                      </div>
                    )}
                    <ChatMessage message={message} chartActions={message.chartActions} />
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-center gap-4 text-slate-500 pl-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" />
                    <span
                      className="w-3 h-3 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <span
                      className="w-3 h-3 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                  <span className="text-lg">AI가 응답을 생성하고 있습니다...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 입력창 영역 */}
          <div className="px-8 pb-4 pt-6">
            <div className="max-w-5xl mx-auto">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSendMessageWrapper}
                isLoading={isLoading}
              />
              <p className="mt-2 text-center text-md text-slate-400">
                AI는 실수를 할 수 있습니다. 중요한 정보는 확인해 주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
