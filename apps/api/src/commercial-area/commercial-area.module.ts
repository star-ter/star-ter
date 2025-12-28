import { Module } from '@nestjs/common';
import { CommercialAreaController } from './commercial-area.controller';
import { CommercialAreaService } from './commercial-area.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommercialAreaController],
  providers: [CommercialAreaService],
  exports: [CommercialAreaService],
})
export class CommercialAreaModule {}
