import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FloatingPopulationService } from './floating-population.service';
import { FloatingPopulationController } from './floating-population.controller';

@Module({
  imports: [ConfigModule],
  controllers: [FloatingPopulationController],
  providers: [FloatingPopulationService],
  exports: [FloatingPopulationService],
})
export class FloatingPopulationModule {}
