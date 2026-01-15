import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string) {
    return this.prisma.user_info.findUnique({ where: { email } });
  }

  async createUser(email: string, nickname: string, hash: string) {
    return this.prisma.user_info.create({
      data: {
        email,
        nickname,
        password: hash,
      },
    });
  }

  async findOrCreateGoogleUser(email: string, name: string) {
    let user = await this.prisma.user_info.findUnique({ where: { email } });

    if (!user) {
      // Google 사용자는 비밀번호가 없으므로 빈 문자열 또는 랜덤 문자열 저장
      user = await this.prisma.user_info.create({
        data: {
          email,
          nickname: name,
          password: '', // Google 로그인 사용자는 비밀번호 없음
        },
      });
    }

    return user;
  }
}
