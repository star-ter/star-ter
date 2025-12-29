import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health/health.controller';

import { PolygonModule } from './polygon/polygon.module';
import { FloatingPopulationModule } from './floating-population/floating-population.module';
import { MarketModule } from './market/market.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    PrismaModule,
    PolygonModule,
    FloatingPopulationModule,
    MarketModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
