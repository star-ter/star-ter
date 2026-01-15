const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export type RecommendParams = {
  age: string;
  region: string;
  operatingTime: string;
  capital: string;
  industryCode?: string | null; // 업종 코드 (예: CS100010) - 선택사항
};

export type ScoredLocation = {
  id: string;
  name: string;
  totalScore: number;
  scores: {
    age: number;
    region: number;
    time: number;
    rent: number;
    industry: number | null; // 업종 미선택시 null
  };
};

export type RecommendResponse = {
  locations: ScoredLocation[];
};

export async function getRecommendations(
  params: RecommendParams,
): Promise<RecommendResponse | null> {
  try {
    const response = await fetch(`${baseUrl}/location-recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.error('[Recommend] API error:', response.status);
      return null;
    }

    return (await response.json()) as RecommendResponse;
  } catch (error) {
    console.error('[Recommend] Network error:', error);
    return null;
  }
}
