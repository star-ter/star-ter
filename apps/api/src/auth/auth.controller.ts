import {
  Controller,
  Post,
  Body,
  Res,
  Logger,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { User } from './decorators/user.decorator';
import type { Response, Request } from 'express';
import type { AuthenticatedUser } from './types/authenticatedUser';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { UsersService } from 'src/user/user.service';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  accessToken: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // 회원가입
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Registering user with email: ${registerDto.email}`);
    return this.authService.register(
      registerDto.email,
      registerDto.nickname,
      registerDto.password,
    );
  }

  // 로그인
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Res() res: Response, @User() user: AuthenticatedUser) {
    this.logger.log(`Logging in user with id: ${user.id}`);
    const { access_token } = this.authService.getJwtToken(user);
    const profileImageKey = await this.usersService.getLatestProfileImageKey(
      user.id,
    );
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 1000 * 60 * 60 * 8, // 8hours
    });
    return res.status(200).json({
      id: user.id,
      nickname: user.nickname,
      on_boarding_completed: user.on_boarding_completed,
      profile_image_key: profileImageKey,
    });
  }

  // Google OAuth 시작
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Google 로그인 페이지로 리다이렉트됩니다.
  }

  // Google OAuth 콜백
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as unknown as GoogleUser;
    this.logger.log(`Google login callback for email: ${googleUser.email}`);

    // DB에서 사용자 찾거나 생성
    const user = await this.authService.findOrCreateGoogleUser(
      googleUser.email,
      googleUser.name,
    );

    // JWT 토큰 생성
    const { access_token } = this.authService.getJwtToken({
      id: user.id,
      nickname: user.nickname,
      on_boarding_completed: user.on_boarding_completed ?? false,
    });

    // 쿠키에 토큰 저장
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 1000 * 60 * 60 * 8, // 8hours
    });

    // 프론트엔드 온보딩 페이지로 리다이렉트 (사용자 정보 쿼리 파라미터 포함)
    const redirectUrl = `${
      process.env.ALLOW_ORIGIN ?? 'http://localhost:3000'
    }/auth/google/callback`;
    return res.redirect(redirectUrl);
  }

  @Post('logout')
  logout(@Res() res: Response) {
    this.logger.log(`Logging out user`);
    res.clearCookie('access_token');
    return res.sendStatus(200);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@User() user: AuthenticatedUser) {
    const profile = await this.usersService.getProfileForAuth(user.id);

    return {
      id: user.id,
      nickname: profile.nickname ?? user.nickname,
      on_boarding_completed:
        profile.on_boarding_completed ?? user.on_boarding_completed,
      profile_image_key: profile.profile_image_key,
    };
  }
}
