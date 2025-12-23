import { IChatRepository } from './chat.interface';
import { ChatMessage } from './types';

export class MockChatRepository implements IChatRepository {
  async sendMessage(message: string, history: ChatMessage[]): Promise<ChatMessage> {
    // 1. Network Latency Simulation (1s ~ 2s random delay)
    const delay = Math.floor(Math.random() * 1000) + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // 2. Keyword Analysis & Response Selection
    let content = '';

    if (message.includes('매출') || message.includes('분석')) {
      content = `이번 달 **총 매출은 4,500만원**입니다. 📈\n전월 대비 약 **12% 상승**했습니다.\n주요 상승 요인은 **배달 주문 증가(25%↑)**로 보입니다.`;
    } else if (message.includes('추천') || message.includes('메뉴')) {
      content = `이 상권에서는 **매운 떡볶이**와 **로제 파스타**가 가장 인기입니다. 🍝\n특히 **20대 여성 고객층**의 선호도가 높으므로, 해당 타겟을 위한 세트 메뉴 구성을 추천드립니다.`;
    } else if (message.includes('안녕')) {
      content = `안녕하세요, 사장님! 👋\n**매출 분석**이나 **신메뉴 추천** 등 가게 운영에 필요한 무엇이든 물어보세요.`;
    } else {
      content = `죄송합니다, 내용을 잘 이해하지 못했어요. 😅\n**"매출 요약해줘"** 또는 **"인기 메뉴 추천해줘"** 처럼 구체적으로 질문해주시면 더 잘 답변해드릴 수 있습니다.`;
    }

    // 3. Construct & Return Response Message
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
  }
}
