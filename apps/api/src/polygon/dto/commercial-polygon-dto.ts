export class CommercialPolygonResponse {
  properties: {
    commercialType: string; // 상권 구분 (TRDAR_SE_1)
    commercialName: string; // 상권 명 (TRDAR_CD_N)
    guCode: string; // 자치구 코드 (SIGNGU_CD_)
    dongCode: string; // 행정동 코드 (ADSTRD_CD_)
  };
  polygons: {
    type: string;
    coordinates: number[][][][] | number[][][] | number[][];
  };
}
