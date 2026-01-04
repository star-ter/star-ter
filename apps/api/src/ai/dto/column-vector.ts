export type BusinessCategoryVectorDto = {
  code: string;
  categoryName: string;
};

export type AreaVectorDto = {
  areaName: string;
  areaLevel: 'city' | 'gu' | 'dong' | 'commercial';
  areaCode: string;
  distance: number;
};
