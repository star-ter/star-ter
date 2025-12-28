export interface OpenApiStoreItem {
  bizesId: string; // 상가업소번호
  bizesNm: string; // 상호명
  indsLclsNm: string; // 상권업종대분류명
  indsSclsNm: string; // 상권업종소분류명
  ksicNm: string; // 표준산업분류명 (우리가 subcategory로 쓸 것)
  rdnmAdr: string; // 풀 도로명주소
  bldMngNo: string; // 건물번호
}

export interface OpenApiBody {
  items: OpenApiStoreItem[];
  totalCount: number;
}
export interface OpenApiResponse {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: OpenApiBody;
}
