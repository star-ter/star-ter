import { Injectable } from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { AiService } from './ai.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly aiService: AiService,
  ) {}

  async handleChatMessage(
    userId: string,
    conversationId: string | null,
    message: string,
  ) {
    if (!conversationId) {
      conversationId = await this.chatRepository
        .createConversation({
          userId: userId,
          title: message.slice(0, 50), // 첫 메시지 일부를 제목으로 사용
        })
        .then((conv) => conv.id);
    }

    if (!conversationId) {
      throw new Error('Failed to create conversation');
    }

    const conversation =
      await this.chatRepository.getConversation(conversationId);

    if (conversation?.userId !== userId) {
      throw new Error('Access denied to this conversation');
    }

    await this.chatRepository.addMessage({
      conversationId: conversationId,
      role: 'user',
      content: message,
    });

    const historyMessages = await this.getHistoryMessages(conversationId);
    const aiResponse = await this.aiService.getAIMessageWithHistory(
      message,
      historyMessages,
    );

    await this.chatRepository.addMessage({
      conversationId: conversationId,
      role: 'assistant',
      content: aiResponse,
    });

    return aiResponse;
  }

  private async getHistoryMessages(
    conversationId: string,
  ): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
    const messages = await this.chatRepository.listMessagesByConversation(
      conversationId,
      { take: 50, skip: 0, cursorId: undefined, order: 'asc' },
    );
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  async getUserConversations(userId: string) {
    return this.chatRepository
      .listConversationsByUser(userId)
      .then((conversations) =>
        conversations.map((conv) => ({
          id: conv.id,
          title: conv.title,
        })),
      );
  }

  async getConversationHistory(userId: string, conversationId: string) {
    const conversation =
      await this.chatRepository.getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new Error('Conversation not found or access denied');
    }

    return this.chatRepository
      .listMessagesByConversation(conversationId)
      .then((messages) =>
        messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      );
  }
}
