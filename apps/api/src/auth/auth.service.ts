import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // 1. username 중복 체크
    const existingUser = await this.prisma.user_info.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('이미 존재하는 EMAIL입니다.');
    }

    // 2. 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 3. User 생성
    const user = await this.prisma.user_info.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        nickname: registerDto.nickname,
      },
    });

    // 비밀번호 제외하고 반환
    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. email을 기준으로 유저를 찾고.
    const user = await this.prisma.user_info.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('EMAIL이 존재하지 않습니다.');
    }

    // 2. 비밀번호 확인
    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    // 3. 토큰 발급
    const accessToken = this.jwtService.sign({
      sub: user.id,
    });

    return { accessToken };
  }
}
