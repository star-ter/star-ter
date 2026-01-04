import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RentResponseDto } from './dto/rent-response.dto';

@Injectable()
export class RentService {
  constructor(private readonly prisma: PrismaService) {}

  async getRentInfo(guName: string, floor: string): Promise<RentResponseDto> {
    // Floor mapping logic: '1' -> 'f1', '-1' -> 'b1f', '2' -> 'f2', etc.
    const floorField = this.mapFloorToField(floor);

    if (!floorField) {
      // Return nulls if floor is invalid or out of range just in case
      return {
        small: null,
        mediumLarge: null,
        aggregate: null,
      };
    }

    const [smallShop, mediumLargeShop, aggregateShop] = await Promise.all([
      this.prisma.rent_small_shop.findUnique({
        where: { gu_name: guName },
      }),
      this.prisma.rent_medium_large_shop.findUnique({
        where: { gu_name: guName },
      }),
      this.prisma.rent_aggregate_shop.findUnique({
        where: { gu_name: guName },
      }),
    ]);

    // Construct response
    const result: RentResponseDto = {
      small: null,
      mediumLarge: null,
      aggregate: null,
    };

    if (floorField) {
      if (smallShop && floorField in smallShop) {
        const value = (
          smallShop as unknown as Record<
            string,
            { toString: () => string } | null
          >
        )[floorField];
        result.small = value?.toString() ?? null;
      }
      if (mediumLargeShop && floorField in mediumLargeShop) {
        const value = (
          mediumLargeShop as unknown as Record<string, number | null>
        )[floorField];
        result.mediumLarge = value ?? null;
      }
      if (aggregateShop && floorField in aggregateShop) {
        const value = (
          aggregateShop as unknown as Record<string, number | null>
        )[floorField];
        result.aggregate = value ?? null;
      }
    }

    return result;
  }

  private mapFloorToField(floor: string): string | null {
    switch (floor) {
      case '-1':
        return 'b1f';
      case '1':
        return 'f1';
      case '2':
        return 'f2';
      case '3':
        return 'f3';
      case '4':
        return 'f4';
      case '5':
        return 'f5';
      default: {
        const floorNum = parseInt(floor, 10);
        if (floorNum >= 6) return 'f6_plus';
        return null;
      }
    }
  }
}
