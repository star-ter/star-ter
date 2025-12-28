import { ComparisonRequest, ComparisonResponse, AreaDetail } from './types';

class CommercialAreaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  }

  /**
   * 두 상권을 비교합니다
   */
  async compareAreas(
    request: ComparisonRequest,
  ): Promise<ComparisonResponse> {
    const response = await fetch(`${this.baseUrl}/commercial-area/compare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to compare areas: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 상권 목록을 조회합니다
   * TODO: 실제 API 연동 필요
   */
  async getAreaList(): Promise<AreaDetail[]> {
    // TODO: 실제 API 호출
    // const response = await fetch(`${this.baseUrl}/commercial-area`);
    // if (!response.ok) throw new Error('Failed to fetch areas');
    // return response.json();

    // Mock 데이터
    return [];
  }

  /**
   * 특정 상권의 상세 정보를 조회합니다
   * TODO: 실제 API 연동 필요
   */
  async getAreaDetail(
    areaCode: string,
    yearMonth?: string,
  ): Promise<AreaDetail> {
    // TODO: 실제 API 호출
    // const url = yearMonth
    //   ? `${this.baseUrl}/commercial-area/${areaCode}?yearMonth=${yearMonth}`
    //   : `${this.baseUrl}/commercial-area/${areaCode}`;
    // const response = await fetch(url);
    // if (!response.ok) throw new Error('Failed to fetch area detail');
    // return response.json();

    // Mock 데이터
    return {
      areaCode,
      areaName: `상권 ${areaCode}`,
      polygon: [],
      x: 127.0,
      y: 37.5,
      stores: { total: 0, byCategory: [] },
      sales: { total: 0, byCategory: [] },
      floatingPopulation: { total: 0, byTimeSlot: [], byAgeGroup: [] },
      residentialPopulation: { total: 0, byAgeGroup: [], households: 0 },
    };
  }
}

export const commercialAreaService = new CommercialAreaService();
