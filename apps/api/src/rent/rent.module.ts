import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RentController } from './rent.controller';
import { RentService } from './rent.service';

@Module({
  imports: [PrismaModule],
  controllers: [RentController],
  providers: [RentService],
})
export class RentModule {}
