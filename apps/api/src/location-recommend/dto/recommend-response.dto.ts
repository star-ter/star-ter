export class ScoredLocation {
  id: string; // 상권 코드
  name: string; // 상권 이름
  totalScore: number;
  scores: {
    age: number;
    region: number;
    time: number;
    rent: number;
    industry: number | null; // 업종 미선택시 null
  };
}

export class RecommendResponseDto {
  locations: ScoredLocation[];
}
