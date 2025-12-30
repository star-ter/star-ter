import { JsonValue } from '@prisma/client/runtime/client';

export class AdminPolygonResponse {
  adm_cd: number;
  adm_nm: string;
  x: number;
  y: number;
  polygons: JsonValue;
  signgu_cd?: string;
  adstrd_cd?: string;
  revenue?: number; // Estimated Revenue
  residentPopulation?: number; // Resident Population
  openingStores?: number; // Opening Stores Count
}
