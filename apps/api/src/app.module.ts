import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';

import { PolygonModule } from './polygon/polygon.module';
import { MarketModule } from './market/market.module';
import { RevenueModule } from './revenue/revenue.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    PrismaModule,
    PolygonModule,
    MarketModule,
    RevenueModule,
    StoreModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
