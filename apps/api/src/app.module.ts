import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

import { SgisModule } from './sgis/sgis.module';
import { VworldModule } from './vworld/vworld.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    PrismaModule,
    SgisModule,
    VworldModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
