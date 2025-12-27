// 
export interface IndustryCategory {
  code: string;
  name: string;
  level: 1 | 2 | 3;
  iconCode?: string; // 대분류에서만 사용
  children?: IndustryCategory[];
}

// API 응답 데이터 구조 (예시 기반)
export interface IndustryStatItem {
  yr: string;
  indutyMlsfcCd: string; // 업종 분류 코드
  indutyMlsfcNm: string; // 업종명
  areaNm: string; // 지역명
  frcsCnt: number; // 가맹점 수
  arUnitAvrgSlsAmt: number; // 면적단위평균매출금액
  crrncyUnitCdNm: string; // (단위 :천원)
}

export interface IndustryStatResponse {
  resultCode: string;
  resultMsg: string;
  numOfRows: string;
  pageNo: string;
  totalCount: number;
  items: IndustryStatItem[];
}

export interface CompareRequest {
  targetA: string;
  targetB: string;
}
