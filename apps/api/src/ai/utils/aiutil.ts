export function getGroupByZoom(level: number) {
  if (level >= 7) return 'GU';
  if (level >= 5) return 'DONG';
  // 5 미만은 모두 상권으로 처리 (건물 제외)
  return 'COMMERCIAL';
}

export function getTableByGroup(group: string) {
  switch (group) {
    case 'GU':
      return {
        table: 'admin_area_gu',
        column: 'signgu_nm',
        coordType: 'geom',
      };
    case 'DONG':
      return {
        table: 'admin_area_dong',
        column: 'adstrd_nm',
        coordType: 'geom',
      };
    case 'COMMERCIAL':
      return {
        table: 'area_commercial',
        column: 'trdar_cd_nm',
        coordType: 'xy',
        xCol: 'xcnts_value',
        yCol: 'ydnts_value',
      };
    default:
      throw new Error('Invalid group');
  }
}
