import { Controller, Get, Query } from '@nestjs/common';
import { RentService } from './rent.service';

@Controller('rent')
export class RentController {
  constructor(private readonly rentService: RentService) {}

  @Get('info')
  async getRentInfo(@Query('gu') gu: string, @Query('floor') floor: string) {
    return this.rentService.getRentInfo(gu, floor);
  }
}
