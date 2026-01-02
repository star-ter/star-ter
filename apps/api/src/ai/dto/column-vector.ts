export class BusinessCategoryVectorDto {
  code: string;
  category_name: string;
}

export class AreaVectorDto {
  areaName: string;
  areaLevel: 'city' | 'gu' | 'dong' | 'commercial';
  areaCode: string;
  distance: number;
}
