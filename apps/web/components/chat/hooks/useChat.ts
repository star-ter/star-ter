import { useState, useCallback } from 'react';
import { sendMessage as apiSendMessage } from '../../../app/actions/chat';
import { type AiAction } from '../../../lib/api/ai';
import { Message, Thread } from '../types';
import type { AiProvider } from '../ChatHeader';
import { useChatStore } from '@/store/use-chat-store';
import {
  buildMessageFromAiResponse,
  splitActions,
} from '@/lib/chat/ai-message';

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
    async (text: string, onActions?: (actions: AiAction[]) => void) => {
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
        const history = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // userId와 aiProvider를 전달
        const response = await apiSendMessage(
          text,
          history,
          aiProvider,
          conversationId || undefined,
        );

        // 차트/리스트 액션과 지도 액션 분리
        const { chartActions, otherActions: mapActions } = splitActions(
          response.actions,
        );

        // Markers 정보가 있다면 content에 hidden-like 텍스트로 추가하여 히스토리에 저장
        // (AI가 다음 턴에서 이전 매물 정보를 참조할 수 있게 함)
        let contentWithMarkers = response.reply;
        const listAction = response.actions?.find(
          (a) => a.type === 'list.listings',
        );
        if (listAction?.payload?.markers) {
          contentWithMarkers += `\n\n[매물 목록 참조용 - 이 메시지는 사용자에게 보이지 않습니다]\n${JSON.stringify(
            listAction.payload.markers,
          )}`;
        }

        const aiMessage: Message = buildMessageFromAiResponse({
          id: crypto.randomUUID(),
          response,
          contentOverride: contentWithMarkers,
          timestamp: new Date(),
          chartActions: chartActions.length > 0 ? chartActions : undefined,
        });

        setMessages((prev) => [...prev, aiMessage]);

        if (response.conversationId) {
          setConversationId(response.conversationId);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chat:updated'));
        }

        // 지도 관련 액션만 onActions로 전달
        if (mapActions.length > 0 && onActions) {
          onActions(mapActions);
        }
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
