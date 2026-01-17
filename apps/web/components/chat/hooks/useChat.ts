import { useState, useCallback } from 'react';
import { sendMessage as apiSendMessage } from '../../../app/actions/chat';
import { Message, Thread } from '../types';
import type { AiProvider } from '../ChatHeader';
import { useChatStore } from '@/store/use-chat-store';
import { buildMessageFromAiResponse } from '@/lib/chat/ai-message';
import {
  processAiActions,
  type ChartItemUpdate,
} from '../actions/actionProcessor';
import { type ActionDispatchPayload } from '../actions/commandTypes';

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

  const sendMessage = useCallback(
    async (text: string, onDispatch?: (payload: ActionDispatchPayload) => void) => {
      if (!text.trim()) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);

      if (messages.length === 0) {
        setCurrentThread((prev) => ({
          ...prev,
          title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        }));
      }

      try {
        // history는 더 이상 필요 없음 (DB에서 관리)
        const response = await apiSendMessage(
          text,
          aiProvider,
          conversationId || undefined,
        );

        const actionPlan = processAiActions({
          reply: response.reply ?? '',
          actions: response.actions,
        });

        const aiMessageId = crypto.randomUUID();
        const aiMessage: Message = buildMessageFromAiResponse({
          id: aiMessageId,
          response,
          contentOverride: actionPlan.contentWithMarkers,
          timestamp: new Date(),
          chartItems:
            actionPlan.chartItems.length > 0 ? actionPlan.chartItems : undefined,
        });

        setMessages((prev) => [...prev, aiMessage]);

        if (response.conversationId) {
          setConversationId(response.conversationId);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chat:updated'));
        }

        if (onDispatch) {
          if (actionPlan.mapCommands.length > 0) {
            console.log('[chat] mapCommands', actionPlan.mapCommands);
          }
          if (actionPlan.openMapPanel || actionPlan.mapCommands.length > 0) {
            onDispatch({
              openMapPanel: actionPlan.openMapPanel,
              mapCommands: actionPlan.mapCommands,
            });
          }
        }

        actionPlan.chartItemUpdates.forEach((updatePromise) => {
          updatePromise.then((update) => {
            setMessages((prev) =>
              applyChartItemUpdate(prev, aiMessageId, update),
            );
          });
        });

        actionPlan.mapCommandUpdates.forEach((commandPromise) => {
          commandPromise.then((commands) => {
            if (!onDispatch || commands.length === 0) return;
            onDispatch({ openMapPanel: true, mapCommands: commands });
          });
        });
      } catch (error) {
        console.error('Failed to get AI response:', error);
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            '죄송합니다. 오류가 발생하여 응답을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
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
