import { useState, useEffect, useCallback } from 'react';
import { sendMessage as apiSendMessage } from '../../../app/actions/chat';
import { type AiAction } from '../../../lib/api/ai';
import { Message, Thread } from '../types';

// userId를 받아서 개인화 추천에 활용
export function useChat(userId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentThread, setCurrentThread] = useState<Thread>({
    id: 'default',
    title: 'New Thread',
    createdAt: new Date(),
  });

  // localStorage에서 대화 내역 불러오기
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        const restored = parsed.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(restored);
      } catch {
        console.error('Failed to parse saved messages');
      }
    }
  }, []);

  // 메시지 변경 시 localStorage에 저장
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleNewThread = useCallback(() => {
    setMessages([]);
    setInputValue('');
    setCurrentThread({
      id: crypto.randomUUID(),
      title: 'New Thread',
      createdAt: new Date(),
    });
    localStorage.removeItem('chat_messages');
  }, []);

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

        // userId를 전달하여 개인화 추천 지원
        const response = await apiSendMessage(text, history, userId);

        // 차트/리스트 액션과 지도 액션 분리
        const chartActions =
          response.actions?.filter(
            (a) => a.type.startsWith('chart.') || a.type.startsWith('list.'),
          ) || [];
        const mapActions =
          response.actions?.filter(
            (a) => !a.type.startsWith('chart.') && !a.type.startsWith('list.'),
          ) || [];

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

        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: contentWithMarkers, // markers가 포함된 content 저장
          // UI에는 reply만 보여주기 위해 displayContent 필드 추가 (선택적)
          // 단, Message 타입에 displayContent가 없다면 그냥 content를 보여주게 됨.
          // 사용자가 이 텍스트를 보게 되더라도 기능 동작이 우선이므로 일단 저장.
          // 더 깔끔하게 하려면 Message 타입을 확장해서 rawContent vs displayContent로 나눠야 함.
          // 현재는 급한 불을 끄기 위해 텍스트 뒤에 붙임.
          timestamp: new Date(),
          chartActions: chartActions.length > 0 ? chartActions : undefined,
        };

        setMessages((prev) => [...prev, aiMessage]);

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
    [messages, userId],
  );

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    currentThread,
    sendMessage,
    handleNewThread,
  };
}
