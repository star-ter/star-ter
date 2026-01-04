import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class BookmarkService {
  constructor(private readonly prisma: PrismaService) {}

  async addBookmark(userId: string, createBookmarkDto: CreateBookmarkDto) {
    const { commercialCode, commercialName } = createBookmarkDto;

    // Check if already exists
    const existing = await this.prisma.bookmark.findUnique({
      where: {
        user_id_commercialCode: {
          user_id: userId,
          commercialCode,
        },
      },
    });

    if (existing) {
      throw new ConflictException('이미 즐겨찾기된 상권입니다.');
    }

    return this.prisma.bookmark.create({
      data: {
        id: randomUUID(),
        user_id: userId,
        commercialCode,
        commercialName,
      },
    });
  }

  async removeBookmark(userId: string, commercialCode: string) {
    // Check if exists
    const existing = await this.prisma.bookmark.findUnique({
      where: {
        user_id_commercialCode: {
          user_id: userId,
          commercialCode,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('즐겨찾기를 찾을 수 없습니다.');
    }

    return this.prisma.bookmark.delete({
      where: {
        user_id_commercialCode: {
          user_id: userId,
          commercialCode,
        },
      },
    });
  }

  async getBookmarks(userId: string) {
    return this.prisma.bookmark.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
