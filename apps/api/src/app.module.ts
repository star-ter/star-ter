import { Module } from '@nestjs/common';
import { ExamModule } from './exam/exam.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: '.env' }), PrismaModule, ExamModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
