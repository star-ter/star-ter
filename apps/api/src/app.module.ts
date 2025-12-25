import { Module } from '@nestjs/common';
import { ExamModule } from './exam/exam.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: '.env' }), PrismaModule, ExamModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
