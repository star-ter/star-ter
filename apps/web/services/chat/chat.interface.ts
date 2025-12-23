import { ChatMessage } from './types';

export interface IChatRepository {
  /**
   * 사용자의 메시지를 전송하고 응답을 받습니다.
   * @param message 사용자 입력 메시지
   * @param history 이전 대화 내역 (Context 유지를 위해 필요)
   */
  sendMessage(message: string, history: ChatMessage[]): Promise<ChatMessage>;
}
