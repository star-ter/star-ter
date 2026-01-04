import {
  Controller,
  Get,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { UserInfoDto } from './dto/userinfo.dto';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './user.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest): Promise<UserInfoDto> {
    const userId = req.user.userId;
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
