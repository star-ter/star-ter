import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const apiBaseUrl =
      configService.get<string>('NEXT_PUBLIC_API_BASE_URL') ||
      `http://localhost:${configService.get<string>('PORT') || '4000'}`;
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: `${apiBaseUrl}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): {
    email: string | undefined;
    name: string;
    picture: string | undefined;
    accessToken: string;
  } {
    const { emails, displayName, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      name: displayName,
      picture: photos?.[0]?.value,
      accessToken,
    };
    return user;
  }
}
