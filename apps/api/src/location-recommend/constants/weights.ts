// Score Weights (총 100점)

// 5개 요소 가중치 (업종 포함)
export const WEIGHTS_WITH_INDUSTRY = {
  age: 20,
  region: 20,
  time: 10,
  rent: 30,
  industry: 20,
} as const;

// 4개 요소 가중치 (업종 미선택시)
export const WEIGHTS_WITHOUT_INDUSTRY = {
  age: 20,
  region: 30,
  time: 15,
  rent: 35,
} as const;

// 기본 가중치 (하위 호환성)
export const WEIGHTS = WEIGHTS_WITH_INDUSTRY;
