import { JsonValue } from '@prisma/client/runtime/client';

export class AdminPolygonResponse {
  adm_cd: number;
  adm_nm: string;
  x: number;
  y: number;
  polygons: JsonValue;
}
