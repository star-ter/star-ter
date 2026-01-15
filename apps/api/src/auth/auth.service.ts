import { Injectable, BadRequestException } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from './types/authenticatedUser';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private authRepository: AuthRepository,
  ) {}

  async register(email: string, nickname: string, password: string) {
    const duplicateUser = await this.authRepository.findOneByEmail(email);

    if (duplicateUser) {
      throw new BadRequestException('User already exists');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);

    const user = await this.authRepository.createUser(email, nickname, hash);

    return { id: user.id, nickname: user.nickname };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.authRepository.findOneByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      return {
        id: user.id,
        nickname: user.nickname,
        on_boarding_completed: user.on_boarding_completed ?? false,
      };
    }

    return null;
  }

  getJwtToken(user: AuthenticatedUser) {
    const payload = {
      nickname: user.nickname,
      sub: user.id,
      on_boarding_completed: user.on_boarding_completed,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async findOrCreateGoogleUser(email: string, name: string) {
    return this.authRepository.findOrCreateGoogleUser(email, name);
  }
}
