export interface VWorldFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    buld_nm?: string;
    sido?: string;
    sigungu?: string;
    gu?: string;
    [key: string]: unknown;
  };
}

export interface VWorldResponse {
  response: {
    status: string;
    error?: { text: string };
    result?: {
      featureCollection?: {
        features: VWorldFeature[];
      };
    };
  };
}
