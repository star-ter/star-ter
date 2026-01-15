'use client';

import { create } from 'zustand';
import type { RecommendResponse } from '@/services/location/locationRecommend.service';

type RecommendState = {
  /** 추천 결과 데이터 */
  recommendResult: RecommendResponse | null;
  /** 데이터 로딩 완료 여부 */
  isLoaded: boolean;
  /** 추천 결과 저장 */
  setRecommendResult: (result: RecommendResponse | null) => void;
  /** 스토어 초기화 */
  clearRecommendResult: () => void;
};

export const useRecommendStore = create<RecommendState>((set) => ({
  recommendResult: null,
  isLoaded: false,
  setRecommendResult: (result) =>
    set({ recommendResult: result, isLoaded: true }),
  clearRecommendResult: () => set({ recommendResult: null, isLoaded: false }),
}));
