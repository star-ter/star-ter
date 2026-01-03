export interface SalesRow {
  stdr_yyqu_cd: string;
  thsmon_selng_amt: bigint;
  mon_selng_amt: bigint;
  tues_selng_amt: bigint;
  wed_selng_amt: bigint;
  thur_selng_amt: bigint;
  fri_selng_amt: bigint;
  sat_selng_amt: bigint;
  sun_selng_amt: bigint;
  tmzon_00_06_selng_amt: bigint;
  tmzon_06_11_selng_amt: bigint;
  tmzon_11_14_selng_amt: bigint;
  tmzon_14_17_selng_amt: bigint;
  tmzon_17_21_selng_amt: bigint;
  tmzon_21_24_selng_amt: bigint;
  ml_selng_amt: bigint;
  fml_selng_amt: bigint;
  agrde_10_selng_amt: bigint;
  agrde_20_selng_amt: bigint;
  agrde_30_selng_amt: bigint;
  agrde_40_selng_amt: bigint;
  agrde_50_selng_amt: bigint;
  agrde_60_above_selng_amt: bigint;
}

export interface StoreRow {
  stor_co: number;
  opbiz_stor_co: number;
  clsbiz_stor_co: number;
  svc_induty_cd_nm: string;
  stdr_yyqu_cd: string;
}

export interface PopulationRow {
  tot_repop_co: number;
  ml_repop_co: number;
  fml_repop_co: number;
  agrde_10_repop_co: number;
  agrde_20_repop_co: number;
  agrde_30_repop_co: number;
  agrde_40_repop_co: number;
  agrde_50_repop_co: number;
  agrde_60_above_repop_co: number;
  stdr_yyqu_cd: string;
}

export interface SalesTrendItem {
  period: string;
  sales: number;
}

export interface DayOfWeekSalesItem {
  day: string;
  sales: number;
  percentage: number;
}

export interface TimeOfDaySalesItem {
  time: string;
  sales: number;
  percentage: number;
}

export interface GenderSalesItem {
  male: number;
  female: number;
}

export interface AgeSalesItem {
  [key: string]: number;
}

export interface StoreCategoryItem {
  name: string;
  count: number;
  open?: number;
  close?: number;
}

export interface PopulationAgeItem {
  [key: string]: number;
}

export interface AnalysisResponse {
  meta: {
    yearQuarter: string;
    regionCode?: string;
    matchedRegions?: string[];
    type?: string;
  };
  sales: {
    total: string;
    trend: SalesTrendItem[];
    dayOfWeek: DayOfWeekSalesItem[];
    timeOfDay: TimeOfDaySalesItem[];
    gender: GenderSalesItem;
    age: AgeSalesItem;
  };
  store: {
    total: number;
    categories: StoreCategoryItem[];
    openingRate?: number;
    closingRate?: number;
  };
  population: {
    total: number;
    male: number;
    female: number;
    age: PopulationAgeItem;
    working?: {
      total: number;
      male: number;
      female: number;
      age: PopulationAgeItem;
    };
  } | null;
}

export interface SalesDelegate {
  findFirst(args: unknown): Promise<{ stdr_yyqu_cd: string } | null>;
  findMany(args: unknown): Promise<SalesRow[]>;
}

export interface StoreDelegate {
  findMany(args: unknown): Promise<StoreRow[]>;
}

export interface PopDelegate {
  findMany(args: unknown): Promise<PopulationRow[]>;
}

export type RegionType = 'GU' | 'DONG' | 'COMMERCIAL';

export interface ResolvedRegion {
  type: RegionType;
  codes: string[];
  name?: string;
}

export interface AnalysisError {
  error: string;
}

export interface ResponseMeta {
  yearQuarter: string;
  regionCode: string;
  matchedRegions: string[];
  type: RegionType;
}

export interface RegionSearchResult {
  type: string;
  code: string;
  name: string;
  fullName: string;
}

export interface SalesAggregate {
  _sum: Record<string, bigint | number | null>;
}

export interface StoreAggregate {
  _sum: Record<string, number | null>;
}

export interface PopulationAggregate {
  _sum: Record<string, number | null>;
}

export interface WorkingPopulationAggregate {
  _sum: Record<string, number | null>;
}

export interface WorkingPopulationRow {
  tot_wrc_popltn_co: number;
  ml_wrc_popltn_co: number;
  fml_wrc_popltn_co: number;
  agrde_10_wrc_popltn_co: number;
  agrde_20_wrc_popltn_co: number;
  agrde_30_wrc_popltn_co: number;
  agrde_40_wrc_popltn_co: number;
  agrde_50_wrc_popltn_co: number;
  agrde_60_above_wrc_popltn_co: number;
  stdr_yyqu_cd: string;
}

export interface StoreCategoryGroup {
  svc_induty_cd_nm: string;
  _sum: Record<string, number | null>;
}

export interface SalesTrendGroup {
  stdr_yyqu_cd: string;
  _sum: Record<string, bigint | null>;
}
