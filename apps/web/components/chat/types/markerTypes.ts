export interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  label?: string; // 예: "치킨", "2000/150"
  type?: 'competitor' | 'default';
  onClick?: () => void;
  // 추가적인 메타데이터
  meta?: Record<string, unknown>;
}
