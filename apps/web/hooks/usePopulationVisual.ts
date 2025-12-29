import { useState, useCallback } from 'react';
import { PopulationRow, GenderFilter, AgeFilter } from '../types/population-types';

export const usePopulationVisual = () => {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('Total');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('Total');
  const [showLayer, setShowLayer] = useState<boolean>(false);

  // 필터 상태에 따른 인구값 추출 로직
  const getPopulationValue = useCallback(
    (row: PopulationRow, gender: GenderFilter, age: AgeFilter): number => {
      // 특정 나이대가 선택된 경우
      if (age !== 'Total') {
        const ageKeyMap: Record<AgeFilter, string> = {
          Total: 'SPOP',
          '0-10': 'pop_0_10',
          '10-20': 'pop_10_20',
          '20-30': 'pop_20_30',
          '30-40': 'pop_30_40',
          '40-50': 'pop_40_50',
          '50-60': 'pop_50_60',
          '60+': 'pop_60_plus',
        };
        return Number(row[ageKeyMap[age]]) || 0;
      }

      // 전연령대 기준 성별 필터
      if (gender === 'Male') {
        let sum = 0;
        for (let i = 0; i <= 70; i += i === 0 ? 10 : 5) {
          sum += Number(row[`M${String(i).padStart(2, '0')}`]) || 0;
        }
        return sum;
      }

      if (gender === 'Female') {
        let sum = 0;
        for (let i = 0; i <= 70; i += i === 0 ? 10 : 5) {
          sum += Number(row[`F${String(i).padStart(2, '0')}`]) || 0;
        }
        return sum;
      }

      return row.SPOP; // 전체
    },
    [],
  );

  return {
    genderFilter,
    setGenderFilter,
    ageFilter,
    setAgeFilter,
    showLayer,
    setShowLayer,
    getPopulationValue,
  };
};