import { JsonValue } from '@prisma/client/runtime/client';

export class BuildingPolygonResponse {
  adm_cd: number;
  adm_nm: string;
  buld_nm: string;
  x: number;
  y: number;
  polygons: JsonValue;
}
