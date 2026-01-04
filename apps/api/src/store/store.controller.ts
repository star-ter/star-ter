import { Controller, Get, Query } from '@nestjs/common';
import { StoreService } from './store.service';
import { GetStoreQueryDto, StoreResponseDto } from './dto/store.dto';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  getStoreStats(@Query() query: GetStoreQueryDto): Promise<StoreResponseDto> {
    return this.storeService.getStoreStats(query);
  }
}
