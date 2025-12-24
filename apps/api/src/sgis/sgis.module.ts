import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SgisController } from './sgis.controller';
import { SgisService } from './sgis.service';

@Module({
  imports: [ConfigModule],
  controllers: [SgisController],
  providers: [SgisService],
})
export class SgisModule {}
