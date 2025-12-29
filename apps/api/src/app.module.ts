import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';

import { PolygonModule } from './polygon/polygon.module';
import { MarketModule } from './market/market.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    PrismaModule,
    PolygonModule,
    MarketModule,
    AiModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
