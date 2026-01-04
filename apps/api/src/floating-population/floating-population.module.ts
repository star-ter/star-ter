import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { FloatingPopulationService } from './floating-population.service';
import { FloatingPopulationController } from './floating-population.controller';
import { FloatingPopulationRepository } from './floating-population.repository';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [FloatingPopulationController],
  providers: [FloatingPopulationService, FloatingPopulationRepository],
  exports: [FloatingPopulationService],
})
export class FloatingPopulationModule {}
