import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VworldController } from './vworld.controller';
import { VworldService } from './vworld.service';

@Module({
  imports: [ConfigModule],
  controllers: [VworldController],
  providers: [VworldService],
})
export class VworldModule {}
