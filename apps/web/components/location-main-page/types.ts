// 메인 페이지 섹션 공통 타입
export interface LocationCardData {
  id: string;
  code: string;
  name: string;
  badge: string;
  badgeType: 'growth' | 'stable' | 'recommend';
  primaryValue: string;
  primaryLabel: string;
  secondaryValue?: string;
  secondaryLabel?: string;
}
