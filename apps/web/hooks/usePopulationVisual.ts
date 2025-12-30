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
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');
  const [showLayer, setShowLayer] = useState<boolean>(false);

  const getPopulationValue = useCallback(
    (feature: CombinedFeature, time: TimeFilter, gender: GenderFilter, age: AgeFilter): number => {
      const slots = time === 'All' ? feature.time_slots : feature.time_slots.filter(s => s.time_slot === time);
      if (slots.length === 0) return 0;

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
        
        return slots.reduce((acc, slot) => acc + (Number(slot[key]) || 0), 0) / (time === 'All' ? 3 : 1);
      }

      if (gender === 'Male') {
        return slots.reduce((acc, slot) => acc + slot.male_total, 0) / (time === 'All' ? 3 : 1);
      }
      if (gender === 'Female') {
        return slots.reduce((acc, slot) => acc + slot.female_total, 0) / (time === 'All' ? 3 : 1);
      }

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