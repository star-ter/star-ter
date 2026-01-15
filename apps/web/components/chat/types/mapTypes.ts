// 지도 관련 타입 정의

export interface BuildingInfo {
  id: string;
  name: string;
  address?: string;
  polygonWkt?: string; // WKT 형식의 폴리곤 (API 호출용)
  stores: StoreInfo[];
}

export interface StoreInfo {
  name: string | null;
  category: string | null;
  subcategory?: string | null;
}

export interface AreaInfo {
  code: string;
  name: string;
  type: 'commercial' | 'dong' | 'gu';
  revenue?: number;               // 분기 매출
  floatingPopulation?: number;    // 유동인구
  storeCount?: number;            // 점포 수
}
