export interface MapSelectionMode {
  enabled: boolean;
  maxSelections: number;
  selectedCodes: string[];
  onSelectionChange?: (selectedCodes: string[], selectedNames: string[]) => void;
}

export interface SelectedAreaInfo {
  areaCode: string;
  areaName: string;
  polygon: KakaoPolygon;
}
