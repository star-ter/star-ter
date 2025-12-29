import { PopulationResponse } from '../../types/population-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function fetchFloatingPopulation(start: number = 1, end: number = 10000): Promise<PopulationResponse> {
  const response = await fetch(`${API_BASE_URL}/floating-population?start=${start}&end=${end}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || '데이터를 불러오는 데 실패했습니다.';
    throw new Error(message);
  }
  
  return response.json();
} 