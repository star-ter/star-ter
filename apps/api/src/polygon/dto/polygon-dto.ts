// 프론트에서 서버로 보내온 fetch 양식
export class GetPolygonDto {
  low_search?: number;
}

// 서버에서 프론트로 보내줄 응답 양식
export class PolygonResponseDto {
  adm_nm?: string;
  buld_nm?: string;
  adm_cd?: string;
  tot_oa_cd?: string;
  x?: string | number;
  y?: string | number;
  polygons: any[]; // Polygon[][][] or MultiPolygon[][][][]
}
