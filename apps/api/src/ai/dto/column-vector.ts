export class ColumnVectorDto {
  text: string;
  domain: string;
  areaLevel: 'city' | 'gu' | 'dong' | 'commercial';
  tableName: string;
  columnName: string;
  dataType: string;
}

export class BusinessCategoryVectorDto {
  code: string;
  category_name: string;
}
