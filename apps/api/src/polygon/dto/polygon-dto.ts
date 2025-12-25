// 프론트에서 서버로 보내온 fetch 양식
export class GetPolygonDto {
  low_search?: number;
}

// 서버에서 프론트로 보낼 응답 데이터 양식
export class PolygonResponseDto {
  type: string;
  bbox?: number[]; // 지도 카메라 이동용 경계 상자
  features: any[]; // 폴리곤 좌표 데이터 배열
}
