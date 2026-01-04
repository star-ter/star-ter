import { Injectable } from '@nestjs/common';
import { UserInfoDto } from './dto/userinfo.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user_info.findMany();
  }

  async findOne(id: string): Promise<UserInfoDto | null> {
    const user = await this.prisma.user_info.findUnique({
      where: { id },
      select: {
        id: true,
        nickname: true,
        email: true,
        createdAt: true,
      },
    });

    // Prisma result matches UserInfoDto conceptually, but ensuring types
    return user as UserInfoDto;
  }
}
