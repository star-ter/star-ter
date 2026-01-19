import { useState, useCallback } from 'react';
import { Message, Thread } from '../types';
import type { AiProvider } from '../ChatHeader';
import { useChatStore } from '@/store/use-chat-store';
import {
  processAiActions,
  type ChartItemUpdate,
} from '../actions/actionProcessor';
import { type ActionDispatchPayload } from '../actions/commandTypes';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type StreamEventName = 'meta' | 'actions' | 'delta' | 'done' | 'error';

type StreamEventHandler = (
  event: StreamEventName,
  data: Record<string, unknown>,
) => void;

async function streamChatResponse(params: {
  message: string;
  aiProvider: AiProvider;
  conversationId?: string;
  onEvent: StreamEventHandler;
  signal?: AbortSignal;
}) {
  const response = await fetch(`${API_BASE_URL}/chat/send/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      message: params.message,
      aiProvider: params.aiProvider,
      conversationId: params.conversationId,
    }),
    signal: params.signal,
  });

  if (!response.ok || !response.body) {
    const message = response.ok
      ? '스트리밍 응답을 받을 수 없습니다.'
      : `AI API responded with status: ${response.status}`;
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const emitEvent = (rawEvent: string) => {
    const lines = rawEvent.split('\n');
    let eventName: StreamEventName = 'delta';
    const dataLines: string[] = [];

    for (const line of lines) {
      if (!line || line.startsWith(':')) continue;
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim() as StreamEventName;
        continue;
      }
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (dataLines.length === 0) return;
    const dataText = dataLines.join('\n');
    let payload: Record<string, unknown> | null = null;
    try {
      payload = JSON.parse(dataText) as Record<string, unknown>;
    } catch (e) {
      console.error('[Stream] JSON parse error:', e, dataText);
      return;
    }
    console.log('[Stream] Event:', eventName, payload);
    params.onEvent(eventName, payload);
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let splitIndex = buffer.indexOf('\n\n');
    while (splitIndex !== -1) {
      const rawEvent = buffer.slice(0, splitIndex);
      buffer = buffer.slice(splitIndex + 2);
      emitEvent(rawEvent);
      splitIndex = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) {
    emitEvent(buffer);
  }
}

// userId를 받아서 개인화 추천에 활용
export function useChat(aiProvider: AiProvider = 'openai') {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const conversationId = useChatStore((state) => state.conversationId);
  const setConversationId = useChatStore((state) => state.setConversationId);
  const clearConversationId = useChatStore(
    (state) => state.clearConversationId,
  );
  const [currentThread, setCurrentThread] = useState<Thread>({
    id: 'default',
    title: 'New Thread',
    createdAt: new Date(),
  });

  const handleNewThread = useCallback(() => {
    setMessages([]);
    setInputValue('');
    clearConversationId();
    setCurrentThread({
      id: crypto.randomUUID(),
      title: 'New Thread',
      createdAt: new Date(),
    });
  }, [clearConversationId]);

  const loadConversation = useCallback(
    (params: {
      conversationId: string;
      messages: Message[];
      title?: string;
    }) => {
      setConversationId(params.conversationId);
      setMessages(params.messages);
      setInputValue('');
      setCurrentThread({
        id: params.conversationId,
        title: params.title || 'New Thread',
        createdAt: new Date(),
      });
    },
    [setConversationId],
  );

  const applyChartItemUpdateToMessage = useCallback(
    (messageId: string, update: ChartItemUpdate) => {
      setMessages((prev) => applyChartItemUpdate(prev, messageId, update));
    },
    [setMessages],
  );

  const sendMessage = useCallback(
    async (text: string, onDispatch?: (payload: ActionDispatchPayload) => void) => {
      if (!text.trim()) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      const aiMessageId = crypto.randomUUID();
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, aiMessage]);
      setInputValue('');
      setIsLoading(true);

      if (messages.length === 0) {
        setCurrentThread((prev) => ({
          ...prev,
          title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        }));
      }

      try {
        let pendingActionPlan:
          | ReturnType<typeof processAiActions>
          | null = null;
        let pendingSources: Message['sources'] | undefined;
        let hasAppliedActions = false;

        const applyPendingActions = () => {
          if (!pendingActionPlan || hasAppliedActions) return;
          hasAppliedActions = true;

          setMessages((prev) =>
            prev.map((message) => {
              if (message.id !== aiMessageId) return message;
              return {
                ...message,
                chartItems:
                  pendingActionPlan && pendingActionPlan.chartItems.length > 0
                    ? pendingActionPlan.chartItems
                    : message.chartItems,
                sources: pendingSources ?? message.sources,
              };
            }),
          );

          if (onDispatch) {
            if (
              pendingActionPlan.openMapPanel ||
              pendingActionPlan.mapCommands.length > 0
            ) {
              onDispatch({
                openMapPanel: pendingActionPlan.openMapPanel,
                mapCommands: pendingActionPlan.mapCommands,
              });
            }
          }

          pendingActionPlan.chartItemUpdates.forEach((updatePromise) => {
            updatePromise.then((update) => {
              setMessages((prev) =>
                applyChartItemUpdate(prev, aiMessageId, update),
              );
            });
          });

          pendingActionPlan.mapCommandUpdates.forEach((commandPromise) => {
            commandPromise.then((commands) => {
              if (!onDispatch || commands.length === 0) return;
              onDispatch({ openMapPanel: true, mapCommands: commands });
            });
          });
        };

        await streamChatResponse({
          message: text,
          aiProvider,
          conversationId: conversationId || undefined,
          onEvent: (event, data) => {
            if (event === 'meta') {
              const nextConversationId = data.conversationId;
              if (typeof nextConversationId === 'string' && nextConversationId) {
                setConversationId(nextConversationId);
                setCurrentThread((prev) => ({
                  ...prev,
                  id: nextConversationId,
                }));
              }
              return;
            }

            if (event === 'actions') {
              const actions = Array.isArray(data.actions) ? data.actions : [];
              const sources = Array.isArray(data.sources)
                ? (data.sources as Message['sources'])
                : undefined;

              pendingActionPlan = processAiActions({
                reply: '',
                actions,
              });
              pendingSources = sources;

              return;
            }

            if (event === 'delta') {
              const delta = typeof data.text === 'string' ? data.text : '';
              if (!delta) return;
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === aiMessageId
                    ? { ...message, content: message.content + delta }
                    : message,
                ),
              );
              return;
            }

            if (event === 'done') {
              const reply = typeof data.reply === 'string' ? data.reply : '';
              const sources = Array.isArray(data.sources)
                ? (data.sources as Message['sources'])
                : undefined;
              const conversationIdFromDone =
                typeof data.conversationId === 'string'
                  ? data.conversationId
                  : null;
              const doneActions = Array.isArray(data.actions)
                ? data.actions
                : null;

              setMessages((prev) =>
                prev.map((message) =>
                  message.id === aiMessageId
                    ? {
                        ...message,
                        content: reply || message.content,
                        sources: sources ?? message.sources,
                        isStreaming: false,
                      }
                    : message,
                ),
              );

              if (doneActions) {
                pendingActionPlan = processAiActions({
                  reply: '',
                  actions: doneActions,
                });
                pendingSources = sources ?? pendingSources;
              }

              applyPendingActions();

              if (conversationIdFromDone) {
                setConversationId(conversationIdFromDone);
              }

              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('chat:updated'));
              }
              return;
            }

            if (event === 'error') {
              const errorMessage =
                typeof data.message === 'string'
                  ? data.message
                  : '스트리밍 중 오류가 발생했습니다.';
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === aiMessageId
                    ? {
                        ...message,
                        content: errorMessage,
                        isStreaming: false,
                      }
                    : message,
                ),
              );
            }
          },
        });
      } catch (error) {
        console.error('Failed to get AI response:', error);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === aiMessageId
              ? {
                  ...message,
                  content:
                    '죄송합니다. 오류가 발생하여 응답을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
                  isStreaming: false,
                }
              : message,
          ),
        );
      } finally {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === aiMessageId
              ? { ...message, isStreaming: false }
              : message,
          ),
        );
        setIsLoading(false);
      }
    },
    [messages, aiProvider, conversationId, setConversationId],
  );

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    currentThread,
    sendMessage,
    handleNewThread,
    loadConversation,
    applyChartItemUpdate: applyChartItemUpdateToMessage,
  };
}

function applyChartItemUpdate(
  messages: Message[],
  messageId: string,
  update: ChartItemUpdate,
): Message[] {
  return messages.map((message) => {
    if (message.id !== messageId || !message.chartItems) {
      return message;
    }

    const updatedItems = message.chartItems.map((item) =>
      item.id === update.id
        ? {
            ...item,
            data: update.data,
            error: update.error,
            isLoading: false,
          }
        : item,
    );

    return {
      ...message,
      chartItems: updatedItems,
    };
  });
}
