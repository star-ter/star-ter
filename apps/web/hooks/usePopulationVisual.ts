import { useState, useCallback } from 'react';
import { 
  CombinedFeature, 
  GenderFilter, 
  AgeFilter, 
  TimeFilter 
} from '../types/population-types';

export const usePopulationVisual = () => {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('Total');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('Total');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All'); // 기본값을 전체 시간대로 설정
  const [showLayer, setShowLayer] = useState<boolean>(false);

  // 필터 상태(시간, 성별, 나이)에 따른 인구값 추출 로직
  const getPopulationValue = useCallback(
    (feature: CombinedFeature, time: TimeFilter, gender: GenderFilter, age: AgeFilter): number => {
      // 1. 선택된 시간대 데이터 찾기
      const slots = time === 'All' ? feature.time_slots : feature.time_slots.filter(s => s.time_slot === time);
      if (slots.length === 0) return 0;

      // 2. 나이대 필터가 적용된 경우
      if (age !== 'Total') {
        const ageKeyMap: Record<Exclude<AgeFilter, 'Total'>, keyof typeof slots[0]> = {
          '10대': 'age_10s_total',
          '20대': 'age_20s_total',
          '30대': 'age_30s_total',
          '40대': 'age_40s_total',
          '50대': 'age_50s_total',
          '60대+': 'age_60s_plus_total',
        };
        const key = ageKeyMap[age];
        if (!key) return 0;
        
        // 여러 슬롯의 합계 계산
        return slots.reduce((acc, slot) => acc + (Number(slot[key]) || 0), 0) / (time === 'All' ? 3 : 1);
      }

      // 3. 성별 필터 적용
      if (gender === 'Male') {
        return slots.reduce((acc, slot) => acc + slot.male_total, 0) / (time === 'All' ? 3 : 1);
      }
      if (gender === 'Female') {
        return slots.reduce((acc, slot) => acc + slot.female_total, 0) / (time === 'All' ? 3 : 1);
      }

      // 4. 전체 유동인구 (평균)
      return slots.reduce((acc, slot) => acc + slot.avg_population, 0) / (time === 'All' ? 3 : 1);
    },
    [],
  );

  return {
    genderFilter,
    setGenderFilter,
    ageFilter,
    setAgeFilter,
    timeFilter,
    setTimeFilter,
    showLayer,
    setShowLayer,
    getPopulationValue,
  };
};