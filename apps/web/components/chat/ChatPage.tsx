'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatHeader, type AiProvider } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatMapSection, type ChatMapSectionRef } from './ChatMapSection';
import { ChatWelcome } from './ChatWelcome';

import { useChat } from './hooks/useChat';
import { useActionDispatcher } from './hooks/useActionDispatcher';
import { getConversationHistory } from '@/services/chat/chat.api';
import { useChatStore } from '@/store/use-chat-store';
import {
  buildMessageFromAiText,
  parseAiResponseText,
} from '@/lib/chat/ai-message';
import {
  processAiActions,
  type ChartItemUpdate,
} from './actions/actionProcessor';
import {
  type ActionDispatchPayload,
  type MapCommand,
} from './actions/commandTypes';

/**
 * ChatPage 컴포넌트 - AI 챗봇의 메인 페이지
 */
export function ChatPage() {
  // 로그인된 사용자 ID 가져오기 (개인화 추천에 사용)

  // AI 프로바이더 상태 (claude | openai)
  const [aiProvider, setAiProvider] = useState<AiProvider>('openai');

  // 커스텀 훅으로 로직 분리
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    currentThread,
    sendMessage,
    handleNewThread,
    loadConversation,
    applyChartItemUpdate,
  } = useChat(aiProvider);
  const conversationId = useChatStore((state) => state.conversationId);

  const [isMapOpen, setIsMapOpen] = useState(false);

  // 지도 섹션 참조 (액션 실행용)
  const mapSectionRef = useRef<ChatMapSectionRef>(null);

  // 스크롤 컨테이너 참조
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 이전 메시지 개수를 저장하여 새로운 메시지 추가 여부만 감지
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    // 새 메시지가 추가된 경우에만 스크롤
    if (messages.length > prevMessagesLength.current) {
      // 마지막 메시지의 ID를 찾아서 스크롤
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        const element = document.getElementById(`msg-${lastMessage.id}`);
        if (element) {
          // block: 'start' 옵션으로 해당 요소를 화면 상단에 맞춤
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // 요소가 아직 DOM에 없으면(그럴 리 적지만) 기존 방식 fallback
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, messages]);

  // Action Dispatcher Hook 사용
  const { dispatch } = useActionDispatcher(mapSectionRef, setIsMapOpen);

  // 메시지 전송 래퍼 (액션 처리 콜백 전달)
  const handleSendMessageWrapper = useCallback(
    (text?: string) => {
      const messageText = typeof text === 'string' ? text : inputValue.trim();
      // useChat의 sendMessage에 dispatch 함수를 전달
      sendMessage(messageText, dispatch);
    },
    [inputValue, sendMessage, dispatch],
  );

  // TODO: 메인에서 검색제거 시 반드시 제거
  const hasLoadedHistory = useRef<string | null>(null);
  const historyRequestId = useRef(0);
  const prevConversationId = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      if (prevConversationId.current) {
        handleNewThread();
      }
      prevConversationId.current = null;
      hasLoadedHistory.current = null;
      return;
    }
    if (messages.length > 0 && currentThread.id === conversationId) {
      return;
    }
    if (hasLoadedHistory.current === conversationId) return;

    let cancelled = false;
    const requestId = historyRequestId.current + 1;
    historyRequestId.current = requestId;
    prevConversationId.current = conversationId;

    getConversationHistory(conversationId)
      .then((history) => {
        if (cancelled || historyRequestId.current !== requestId) return;
        const chartUpdateQueue: Array<
          Promise<{ messageId: string; update: ChartItemUpdate }>
        > = [];
        let lastMapPayload: ActionDispatchPayload | null = null;
        const mapCommandUpdates: Promise<MapCommand[]>[] = [];

        const mapped = history.map((item, index) => {
          const baseMessage = buildMessageFromAiText({
            id: `${conversationId}-${index}`,
            role: item.role,
            content: item.content,
            timestamp: new Date(),
          });

          if (baseMessage.role !== 'assistant') {
            return baseMessage;
          }

          const parsed = parseAiResponseText(item.content);
          const actions =
            item.metadata?.actions ??
            (parsed?.actions && parsed.actions.length > 0
              ? parsed.actions
              : []);
          const sources = item.metadata?.sources;

          if (!actions || actions.length === 0) {
            return {
              ...baseMessage,
              sources: sources ?? undefined,
            };
          }

          const actionPlan = processAiActions({
            reply: baseMessage.content,
            actions,
          });

          actionPlan.chartItemUpdates.forEach((updatePromise) => {
            chartUpdateQueue.push(
              updatePromise.then((update) => ({
                messageId: baseMessage.id,
                update,
              })),
            );
          });

          if (
            actionPlan.mapCommands.length > 0 ||
            actionPlan.mapCommandUpdates.length > 0
          ) {
            lastMapPayload = {
              openMapPanel: actionPlan.openMapPanel,
              mapCommands: actionPlan.mapCommands,
            };
            mapCommandUpdates.push(...actionPlan.mapCommandUpdates);
          }

          return {
            ...baseMessage,
            chartItems:
              actionPlan.chartItems.length > 0
                ? actionPlan.chartItems
                : undefined,
            sources: sources ?? undefined,
          };
        });
        const titleFromHistory =
          mapped.find((item) => item.role === 'user')?.content?.slice(0, 50) ||
          'New Thread';
        loadConversation({
          conversationId: conversationId,
          messages: mapped,
          title: titleFromHistory,
        });
        hasLoadedHistory.current = conversationId;

        chartUpdateQueue.forEach((updatePromise) => {
          updatePromise.then(({ messageId, update }) => {
            if (cancelled) return;
            applyChartItemUpdate(messageId, update);
          });
        });

        const finalMapPayload = lastMapPayload as ActionDispatchPayload | null;
        if (
          finalMapPayload?.mapCommands &&
          finalMapPayload.mapCommands.length > 0
        ) {
          dispatch(finalMapPayload);
        }

        mapCommandUpdates.forEach((commandPromise) => {
          commandPromise.then((commands) => {
            if (cancelled || commands.length === 0) return;
            dispatch({
              openMapPanel: lastMapPayload?.openMapPanel ?? false,
              mapCommands: commands,
            });
          });
        });
      })
      .catch((error) => {
        if (cancelled || historyRequestId.current !== requestId) return;
        console.error('Failed to load conversation history:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [
    conversationId,
    loadConversation,
    handleNewThread,
    applyChartItemUpdate,
    dispatch,
  ]);

  return (
    <div className="flex h-full">
      {/* 지도 영역 (왼쪽) */}
      <ChatMapSection ref={mapSectionRef} isOpen={isMapOpen} />

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-background rounded-2xl overflow-hidden border border-border">
        <ChatHeader
          threadTitle={currentThread.title}
          onNewThread={handleNewThread}
          isMapOpen={isMapOpen}
          onMapToggle={() => setIsMapOpen(!isMapOpen)}
          aiProvider={aiProvider}
          onAiProviderChange={setAiProvider}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar">
            <div className="max-w-5xl mx-auto space-y-8">
              {messages.length === 0 ? (
                <ChatWelcome onSuggestionClick={handleSendMessageWrapper} />
              ) : (
                messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    chartItems={message.chartItems}
                    sources={message.sources}
                  />
                ))
              )}

              {/* {isLoading && (
                <div className="flex items-center gap-4 text-muted-foreground pl-2">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <span
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                  <span className="text-h5">
                    AI가 응답을 생성하고 있습니다...
                  </span>
                </div>
              )} */}

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
              <p className="mt-2 text-center text-caption text-muted-foreground">
                AI는 실수를 할 수 있습니다. 중요한 정보는 확인해 주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
