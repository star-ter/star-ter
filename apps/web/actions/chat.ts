'use server';

import { chatService } from '@/services/chat/chat.service';
import { ChatMessage } from '@/services/chat/types';

interface ChatState {
  messages: ChatMessage[];
}

export async function sendMessageAction(
  prevState: ChatState,
  formData: FormData
): Promise<ChatState> {
  const message = formData.get('message') as string;

  if (!message || message.trim() === '') {
    return prevState;
  }

  // 1. 사용자 메시지 객체 생성 (Optimistic UI를 위해 필요하지만, 서버에서도 생성하여 저장)
  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: message,
    timestamp: new Date(),
  };

  // 2. 현재 대화 내역 (Context)
  const currentHistory = [...(prevState.messages || []), userMessage];

  try {
    // 3. Service Layer를 통해 메시지 전송 (Mock 또는 Real API가 실행됨)
    //    UI 로직은 비즈니스 로직(어떻게 전송하는지)을 알 필요가 없음.
    const responseMessage = await chatService.sendMessage(message, currentHistory);

    // 4. 응답 메시지를 포함하여 새로운 상태 반환
    return {
      messages: [...currentHistory, responseMessage],
    };
  } catch (error) {
    console.error('Failed to send message:', error);
    // 에러 발생 시에도 사용자 메시지는 보여주되, 에러 메시지를 추가할 수 있음
    return {
      messages: currentHistory,
    };
  }
}
