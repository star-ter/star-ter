export type ChartActionType =
  | 'chart.revenue'
  | 'chart.survival'
  | 'chart.breakeven'
  | 'list.listings'
  | 'list.similar_areas';

export interface ChartPayload {
  areaCode?: string | null;
  areaName?: string | null;
  industryCode?: string | null;
  listingId?: string | null;
  lat?: number | null;
  lng?: number | null;
  maxDeposit?: number | null;
  maxMonthlyRent?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  markers?: unknown;
}

export interface ChartItem {
  id: string;
  type: ChartActionType;
  payload: ChartPayload;
  data: unknown | null;
  isLoading: boolean;
  error?: string;
}
