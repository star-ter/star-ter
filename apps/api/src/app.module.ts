import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health/health.controller';

import { PolygonModule } from './polygon/polygon.module';
import { FloatingPopulationModule } from './floating-population/floating-population.module';
import { MarketModule } from './market/market.module';
import { RevenueModule } from './revenue/revenue.module';
import { StoreModule } from './store/store.module';
import { GeoModule } from './geo/geo.module';
import { AiModule } from './ai/ai.module';
import { AssistantModule } from './assistant/assistant.module';
import { AnalysisModule } from './analysis/analysis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module';
import { ReportModule } from './report/report.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { RentModule } from './rent/rent.module';
import { RealEstateModule } from './real-estate/real_estate.module';
import { RealEstateBookmarkModule } from './real-estate-bookmark/real_estate_bookmark.module';
import { ImageModule } from './image/image.module';
import { LocationRecommendModule } from './location-recommend/location-recommend.module';
import { NewsModule } from './news/news.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    PrismaModule,
    PolygonModule,
    FloatingPopulationModule,
    MarketModule,
    RevenueModule,
    StoreModule,
    GeoModule,
    AiModule,
    AssistantModule,
    AnalysisModule,
    AuthModule,
    UsersModule,
    ReportModule,
    BookmarkModule,
    RentModule,
    RealEstateModule,
    RealEstateBookmarkModule,
    ImageModule,
    LocationRecommendModule,
    NewsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
