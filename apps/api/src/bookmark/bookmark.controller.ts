import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { AuthGuard } from '@nestjs/passport'; // Using standard AuthGuard, or your custom one if exists

import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@Controller('bookmark')
@UseGuards(AuthGuard('jwt'))
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  async addBookmark(
    @Req() req: RequestWithUser,
    @Body() createBookmarkDto: CreateBookmarkDto,
  ) {
    return this.bookmarkService.addBookmark(req.user.userId, createBookmarkDto);
  }

  @Delete(':code')
  async removeBookmark(
    @Req() req: RequestWithUser,
    @Param('code') commercialCode: string,
  ) {
    return this.bookmarkService.removeBookmark(req.user.userId, commercialCode);
  }

  @Get()
  async getBookmarks(@Req() req: RequestWithUser) {
    return this.bookmarkService.getBookmarks(req.user.userId);
  }
}
