import { useState, useCallback } from 'react';
import { 
  CombinedFeature, 
  GenderFilter, 
  AgeFilter, 
  TimeFilter,
  TimeSlotPopulation
} from '../types/population-types';

export const usePopulationVisual = () => {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('Total');
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('Total');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');
  const [showLayer, setShowLayer] = useState<boolean>(false);

  const getPopulationValue = useCallback(
    (feature: CombinedFeature, time: TimeFilter, gender: GenderFilter, age: AgeFilter): number => {
      const slots = time === 'All' ? feature.time_slots : feature.time_slots.filter(s => s.time_slot === time);
      if (slots.length === 0) return 0;

      const timeDivisor = time === 'All' ? 3 : 1;

      // 필터 조합에 따른 필드 매핑
      const getFieldsForFilter = (g: GenderFilter, a: AgeFilter): (keyof TimeSlotPopulation)[] => {
        const genders = g === 'Total' ? ['m', 'f'] : [g === 'Male' ? 'm' : 'f'];
        
        let ages: string[] = [];
        if (a === '10대') ages = ['10', '15'];
        else if (a === '20대') ages = ['20', '25'];
        else if (a === '30대') ages = ['30', '35'];
        else if (a === '40대') ages = ['40', '45'];
        else if (a === '50대') ages = ['50', '55'];
        else if (a === '60대+') ages = ['60', '65', '70'];
        else {
          // Age 'Total'인 경우
          if (g === 'Male') return ['male_total'];
          if (g === 'Female') return ['female_total'];
          return ['avg_population'];
        }

        const result: (keyof TimeSlotPopulation)[] = [];
        genders.forEach(prefix => {
          ages.forEach(ageSuffix => {
            result.push(`${prefix}${ageSuffix}` as keyof TimeSlotPopulation);
          });
        });
        return result;
      };

      const targetFields = getFieldsForFilter(gender, age);
      
      // 특수 필드(avg_population 등) 처리
      if (targetFields.length === 1 && (targetFields[0] === 'avg_population' || targetFields[0] === 'male_total' || targetFields[0] === 'female_total')) {
        const key = targetFields[0];
        return slots.reduce((acc, slot) => acc + (Number(slot[key]) || 0), 0) / timeDivisor;
      }

      // 일반적인 나이대/성별 조합 합산
      const sum = slots.reduce((acc, slot) => {
        let slotSum = 0;
        targetFields.forEach(field => {
          slotSum += (Number(slot[field]) || 0);
        });
        return acc + slotSum;
      }, 0);

      return sum / timeDivisor;
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