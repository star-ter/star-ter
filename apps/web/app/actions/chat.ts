'use server';

import { cookies } from 'next/headers';
import { type AiChatResponse } from '@/lib/api/ai';
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// AI 프로바이더 타입
type AiProvider = 'claude' | 'openai';

// Server Action 함수
// 클라이언트에서 await sendMessage(...) 형태로 호출 가능
export async function sendMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  aiProvider: AiProvider = 'openai', // 런타임에 프로바이더 선택
  conversationId?: string,
): Promise<AiChatResponse> {
  // 프로바이더에 따른 API 엔드포인트 결정
  const endpoint =
    aiProvider === 'claude' ? '/assistant/message' : '/chat/send';

  console.log(`[Server Action] Sending message to ${aiProvider}:`, message);
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify(
        aiProvider === 'claude'
          ? { message, history }
          : { message, conversationId },
      ),
      // 캐싱 방지 (항상 새로운 응답 필요)
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(
        '[Server Action] API Error:',
        response.status,
        response.statusText,
      );
      throw new Error(`AI API responded with status: ${response.status}`);
    }

    const result = await response.json();
    return {
      reply: result.reply || '',
      actions: result.actions || [],
    };
  } catch (error) {
    console.error('[Server Action] Failed:', error);
    // 에러를 클라이언트로 전파하거나, 기본 에러 메시지 반환
    throw new Error('AI 서비스를 연결할 수 없습니다.');
  }
}
