/**
 * Revenue Service 내부에서 사용하는 타입 정의
 */

import { RevenueLevel } from './revenue.dto';

/**
 * Prisma 모델 설정 타입
 */
export interface ModelConfig {
  modelName:
    | 'salesCity'
    | 'salesGu'
    | 'salesDong'
    | 'salesBackarea'
    | 'salesCommercial';
  storeModelName:
    | 'storeCity'
    | 'storeGu'
    | 'storeDong'
    | 'storeBackarea'
    | 'storeCommercial';
  footTrafficModelName:
    | 'footTrafficCity'
    | 'footTrafficGu'
    | 'footTrafficDong'
    | 'footTrafficBackarea'
    | 'footTrafficCommercial';
  areaModelName?:
    | 'areaCity'
    | 'areaGu'
    | 'areaDong'
    | 'areaBackarea'
    | 'areaCommercial';
  codeField: string;
  nameField: string;
}

/**
 * 레벨별 모델 설정 맵
 */
export const modelMap: Record<RevenueLevel, ModelConfig> = {
  city: {
    codeField: 'mega_cd',
    nameField: 'mega_cd_nm',
    modelName: 'salesCity',
    storeModelName: 'storeCity',
    footTrafficModelName: 'footTrafficCity',
    areaModelName: 'areaCity',
  },
  gu: {
    codeField: 'signgu_cd',
    nameField: 'signgu_cd_nm',
    modelName: 'salesGu',
    storeModelName: 'storeGu',
    footTrafficModelName: 'footTrafficGu',
    areaModelName: 'areaGu',
  },
  dong: {
    codeField: 'adstrd_cd',
    nameField: 'adstrd_cd_nm',
    modelName: 'salesDong',
    storeModelName: 'storeDong',
    footTrafficModelName: 'footTrafficDong',
    areaModelName: 'areaDong',
  },
  backarea: {
    codeField: 'trdar_cd',
    nameField: 'trdar_cd_nm',
    modelName: 'salesBackarea',
    storeModelName: 'storeBackarea',
    footTrafficModelName: 'footTrafficBackarea',
    areaModelName: 'areaBackarea',
  },
  commercial: {
    codeField: 'trdar_cd',
    nameField: 'trdar_cd_nm',
    modelName: 'salesCommercial',
    storeModelName: 'storeCommercial',
    footTrafficModelName: 'footTrafficCommercial',
    areaModelName: 'areaCommercial',
  },
};

/**
 * 매출 데이터 조회 결과 타입
 */
export interface RevenueRow {
  stdr_yyqu_cd: string;
  svc_induty_cd: string;
  svc_induty_cd_nm: string;
  thsmon_selng_amt: number | bigint;
  thsmon_selng_co: number | bigint;
}

/**
 * 매출 랭킹 그룹화 결과 타입
 */
export interface RevenueRankingRow {
  [key: string]: unknown;
  _sum: {
    thsmon_selng_amt: number | bigint;
    thsmon_selng_co: number | bigint;
  };
}

/**
 * 동적 Prisma 모델 타입 (Service용)
 */
export interface PrismaModel {
  findMany(args: {
    where?: Record<string, unknown>;
    select?: Record<string, boolean>;
    distinct?: string[];
  }): Promise<Record<string, unknown>[]>;
  findFirst(args: {
    select?: Record<string, boolean>;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<Record<string, unknown> | null>;
  groupBy(args: {
    by: string[];
    where?: Record<string, unknown>;
    _sum?: Record<string, boolean>;
    orderBy?: Record<string, unknown>;
    take?: number;
  }): Promise<RevenueRankingRow[]>;
}

/**
 * Repository 전용 Prisma 모델 타입 (aggregate 메서드 포함)
 */
export interface RepositoryPrismaModel {
  findMany(args: {
    where?: Record<string, unknown>;
    select?: Record<string, boolean>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
  }): Promise<Record<string, unknown>[]>;
  findFirst(args: {
    where?: Record<string, unknown>;
    select?: Record<string, boolean>;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<Record<string, unknown> | null>;
  aggregate(args: {
    where?: Record<string, unknown>;
    _sum?: Record<string, boolean>;
  }): Promise<DemographicsAggregateResult>;
  groupBy(args: {
    by: string[];
    where?: Record<string, unknown>;
    _sum?: Record<string, boolean>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
  }): Promise<GrowthRow[]>;
}

// ============================================
// Raw Query 결과 타입
// ============================================

/**
 * 성장률 랭킹 Raw Query 결과
 */
export interface GrowthRankingRawRow {
  code: string;
  name: string;
  current_amt: bigint | number;
  prev_amt: bigint | number;
  change_type: string | null;
  growth_rate: number;
}

/**
 * 평균 매출 랭킹 Raw Query 결과
 */
export interface AvgSalesRankingRawRow {
  code: string;
  name: string;
  total_amt: bigint | number;
  store_count: bigint | number;
  prev_amt: bigint | number;
  change_type: string | null;
  avg_sales: bigint | number;
  growth_rate: number;
  male_ratio: number;
}

/**
 * Top Sectors (Bar Chart) 결과 타입
 */
export interface TopSectorRow {
  svc_induty_cd_nm: string;
  thsmon_selng_amt: number | bigint;
}

/**
 * Growth (Area Chart) 결과 타입
 */
export interface GrowthRow {
  stdr_yyqu_cd: string;
  _sum: {
    thsmon_selng_amt: number | bigint;
  };
}

/**
 * Top Stores 결과 타입
 */
export interface TopStoreRow {
  svc_induty_cd_nm: string;
  stor_co: number | bigint;
}

/**
 * Area 결과 타입
 */
export interface AreaRow {
  relm_ar: number | bigint;
}

/**
 * Revenue 그룹화 결과 (prevMap 용)
 */
export interface RevenuePrevGroupRow {
  [key: string]: unknown;
  _sum?: {
    thsmon_selng_amt?: number | bigint | null;
  };
}

/**
 * Revenue Ranking Item with fluctuation
 */
export interface RevenueRankingItem {
  code: string;
  name: string;
  amount: number;
  count: number;
  changeType?: string;
  fluctuationRate?: number;
}

/**
 * Demographics 집계 결과 타입
 */
export interface DemographicsAggregateResult {
  _sum: {
    ml_selng_amt: number | bigint | null;
    fml_selng_amt: number | bigint | null;
    agrde_10_selng_amt: number | bigint | null;
    agrde_20_selng_amt: number | bigint | null;
    agrde_30_selng_amt: number | bigint | null;
    agrde_40_selng_amt: number | bigint | null;
    agrde_50_selng_amt: number | bigint | null;
    agrde_60_above_selng_amt: number | bigint | null;
  };
}

/**
 * FootTraffic 결과 타입
 */
export interface FootTrafficRow {
  tmzon_00_06_flpop_co: number | bigint | null;
  tmzon_06_11_flpop_co: number | bigint | null;
  tmzon_11_14_flpop_co: number | bigint | null;
  tmzon_14_17_flpop_co: number | bigint | null;
  tmzon_17_21_flpop_co: number | bigint | null;
  tmzon_21_24_flpop_co: number | bigint | null;
}
