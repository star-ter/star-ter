import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import {
  AiChatOrchestrator,
  AiChatOptions,
} from './core/ai-chat-orchestrator.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly aiChatOrchestrator: AiChatOrchestrator,
  ) {}

  async handleChatMessage(
    userId: string,
    conversationId: string | null,
    message: string,
    options: AiChatOptions = {},
  ) {
    return this.aiChatOrchestrator.handleMessage(
      userId,
      conversationId,
      message,
      options,
    );
  }

  async handleChatMessageStream(
    userId: string,
    conversationId: string | null,
    message: string,
    options: AiChatOptions,
    onEvent: (event: string, data: Record<string, unknown>) => void,
    signal?: AbortSignal,
  ) {
    return this.aiChatOrchestrator.handleMessageStream(
      userId,
      conversationId,
      message,
      options,
      onEvent,
      signal,
    );
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
          metadata: msg.metadata ?? null,
        })),
      );
  }

  async updateConversationTitle(
    userId: string,
    conversationId: string,
    title: string,
  ) {
    const conversation =
      await this.chatRepository.getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    const updated = await this.chatRepository.updateConversation(
      conversationId,
      {
        title,
      },
    );

    return {
      id: updated.id,
      title: updated.title,
    };
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conversation =
      await this.chatRepository.getConversation(conversationId);
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    await this.chatRepository.deleteConversation(conversationId);
    return { id: conversationId };
  }
}
