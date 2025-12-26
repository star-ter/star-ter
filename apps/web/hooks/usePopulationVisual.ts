import { useState, useCallback } from 'react';
import { PopulationRow, GenderFilter, AgeFilter } from '../types/population-types';
import { fetchFloatingPopulation } from '../services/population/population-service';

export const usePopulationVisual = () => {
  const [data, setData] = useState<PopulationRow[]>([]);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('Total');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('Total')

  // 데이터 로드
  const loadData = useCallback(async (start: number = 1, end: number = 10000) => {
    try {
      const result = await fetchFloatingPopulation(start, end);
      setData(result.row || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 필터 상태에 따른 인구값 추출 로직
  const getPopulationValue = useCallback((row: PopulationRow, gender: GenderFilter, age: AgeFilter): number => {
    // 특정 나이대가 선택된 경우
    if (age !== 'Total') {
      const ageKeyMap: Record<AgeFilter, string> = {
        'Total': 'SPOP',
        '0-10': 'pop_0_10', '10-20': 'pop_10_20', '20-30': 'pop_20_30',
        '30-40': 'pop_30_40', '40-50': 'pop_40_50', '50-60': 'pop_50_60', '60+': 'pop_60_plus',
      };
      return Number(row[ageKeyMap[age]]) || 0;
    }

    // 전연령대 기준 성별 필터
    if (gender === 'Male') {
      let sum = 0;
      for (let i = 0; i <= 70; i += (i === 0 ? 10 : 5)) {
        sum += Number(row[`M${String(i).padStart(2, '0')}`]) || 0;
      }
      return sum;
    }
    
    if (gender === 'Female') {
      let sum = 0;
      for (let i = 0; i <= 70; i += (i === 0 ? 10 : 5)) {
        sum += Number(row[`F${String(i).padStart(2, '0')}`]) || 0;
      }
      return sum;
    }

    return row.SPOP; // 전체
  }, []);

  // 색상 계산 (데이터 수치 -> HSL 색상상태)
  const getColorByValue = useCallback((value: number, max: number) => {
    if (max === 0) return '#4ade80';
    const ratio = Math.min(value / max, 1);
    const hue = (1 - ratio) * 120; // 120(초록) -> 0(빨강)
    return `hsl(${hue}, 70%, 50%)`;
  }, []);

  return { 
    data, genderFilter, setGenderFilter, ageFilter, setAgeFilter, 
    loadData, getPopulationValue, getColorByValue 
  };
};