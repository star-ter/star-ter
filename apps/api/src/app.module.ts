import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';

import { PolygonModule } from './polygon/polygon.module';
import { FloatingPopulationModule } from './floating-population/floating-population.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    PrismaModule,
    PolygonModule,
    FloatingPopulationModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
