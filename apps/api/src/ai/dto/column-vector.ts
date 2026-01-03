export class BusinessCategoryVectorDto {
  code: string;
  categoryName: string;
}

export class AreaVectorDto {
  areaName: string;
  areaLevel: 'city' | 'gu' | 'dong' | 'commercial';
  areaCode: string;
  distance: number;
}
