import { CombinedLayerResponse } from '../../types/population-types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

/**
 * 특정 지도 영역(Bounds) 내의 유동인구 레이어 데이터를 조회합니다.
 */
export async function fetchPopulationLayer(
  sw: { lat: number; lng: number },
  ne: { lat: number; lng: number },
  signal?: AbortController['signal'],
): Promise<CombinedLayerResponse> {
  const params = new URLSearchParams({
    minLat: sw.lat.toString(),
    minLng: sw.lng.toString(),
    maxLat: ne.lat.toString(),
    maxLng: ne.lng.toString(),
  });

  const response = await fetch(
    `${API_BASE_URL}/floating-population/layer?${params.toString()}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error('유동인구 레이어 데이터를 불러오는 데 실패했습니다.');
  }

  return response.json();
}