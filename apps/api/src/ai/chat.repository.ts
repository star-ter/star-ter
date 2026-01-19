import { Injectable } from '@nestjs/common';
import { MessageRole, Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type PaginationOptions = {
  take?: number;
  skip?: number;
  cursorId?: string;
  order?: 'asc' | 'desc';
};

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(params: { userId: string; title?: string }) {
    const { userId, title } = params;
    return this.prisma.conversation.create({
      data: {
        userId,
        title,
      },
    });
  }

  async updateConversation(
    conversationId: string,
    data: {
      title?: string;
    },
  ) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data,
    });
  }

  async deleteConversation(conversationId: string) {
    return this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  async getConversation(conversationId: string, includeMessages = false) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: includeMessages
        ? { messages: { orderBy: { createdAt: 'asc' } } }
        : undefined,
    });
  }

  async listConversationsByUser(
    userId: string,
    options: PaginationOptions = {},
  ) {
    const { take = 20, skip = 0, cursorId, order = 'desc' } = options;
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: order },
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : { skip }),
      take,
    });
  }

  async addMessage(params: {
    conversationId: string;
    role: MessageRole;
    content: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const { conversationId, role, content, metadata } = params;

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId: conversationId,
          role: role,
          content: content,
          ...(metadata !== undefined ? { metadata } : {}),
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  }

  async updateMessage(
    messageId: string,
    data: {
      content?: string;
      tokenCount?: number;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    return this.prisma.message.update({
      where: { id: messageId },
      data,
    });
  }

  async getMessage(messageId: string) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
    });
  }

  async listMessagesByConversation(
    conversationId: string,
    options: PaginationOptions = {},
  ) {
    const { take = 50, skip = 0, cursorId, order = 'asc' } = options;
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: order },
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : { skip }),
      take,
    });
  }
}
