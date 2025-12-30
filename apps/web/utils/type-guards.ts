import {
  AdminArea,
  BuildingArea,
  CommercialApiResponse,
} from '@/types/map-types';

export function isAdminAreaList(data: unknown): data is AdminArea[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    data[0] !== null &&
    'adm_cd' in data[0]
  );
}

export function isBuildingAreaList(data: unknown): data is BuildingArea[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    data[0] !== null &&
    'buld_nm' in data[0]
  );
}

export function isCommercialApiResponseList(
  data: unknown,
): data is CommercialApiResponse[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    data[0] !== null &&
    'properties' in data[0] // GeoJSON 구조 체크
  );
}
