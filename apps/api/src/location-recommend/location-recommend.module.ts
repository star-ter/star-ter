import { Module } from '@nestjs/common';
import { LocationRecommendController } from './location-recommend.controller';
import { LocationRecommendService } from './location-recommend.service';
import { MarketModule } from '../market/market.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AgeScoreCalculator } from './calculators/age-score.calculator';
import { TimeScoreCalculator } from './calculators/time-score.calculator';
import { RentScoreCalculator } from './calculators/rent-score.calculator';
import { RegionScoreCalculator } from './calculators/region-score.calculator';
import { RentRepository } from './repositories/rent.repository';
import { PopulationRepository } from './repositories/region.repository';
import { SalesRepository } from './repositories/sales.repository';
import { UsersModule } from '../user/user.module';

@Module({
  imports: [MarketModule, PrismaModule, UsersModule],
  controllers: [LocationRecommendController],
  providers: [
    LocationRecommendService,
    AgeScoreCalculator,
    TimeScoreCalculator,
    RentScoreCalculator,
    RegionScoreCalculator,
    RentRepository,
    PopulationRepository,
    SalesRepository,
  ],
  exports: [LocationRecommendService],
})
export class LocationRecommendModule {}
