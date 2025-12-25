import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

import { PolygonModule } from './polygon/polygon.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    PrismaModule,
    PolygonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
