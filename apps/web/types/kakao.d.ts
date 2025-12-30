export interface KakaoMapsServices {
  Geocoder: new () => {
    addressSearch: (
      address: string,
      callback: (result: KakaoGeocoderResult[], status: string) => void,
    ) => void;
    coord2Address: (
      x: number,
      y: number,
      callback: (result: KakaoCoord2AddressResult[], status: string) => void,
    ) => void;
  };
  Places: new () => {
    keywordSearch: (
      keyword: string,
      callback: (result: KakaoPlaceResult[], status: string) => void,
      options?: { location?: KakaoLatLngClass; radius?: number },
    ) => void;
  };
  Status: {
    OK: string;
    ZERO_RESULT: string;
    ERROR: string;
  };
}

export interface KakaoGeocoderResult {
  x: string;
  y: string;
  address_name: string;
  road_address?: {
    address_name: string;
    building_name?: string;
  };
}

export interface KakaoCoord2AddressResult {
  x: string;
  y: string;
  address: KakaoAddress;
  road_address?: KakaoRoadAddress;
}

export interface KakaoAddress {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  main_address_no: string;
  sub_address_no: string;
}

export interface KakaoRoadAddress {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  road_name: string;
  building_name: string;
  main_building_no: string;
  sub_building_no: string;
}

export interface KakaoPlaceResult {
  x: string;
  y: string;
  place_name: string;
  address_name: string;
  road_address_name?: string;
}

export interface KakaoLatLngClass {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoLatLngBoundsClass {
  extend: (latlng: KakaoLatLngClass) => void;
  getSouthWest: () => KakaoLatLngClass;
  getNorthEast: () => KakaoLatLngClass;
  contain: (latlng: KakaoLatLngClass) => boolean;
}

export interface KakaoMapClass {
  getLevel: () => number;
  setLevel: (level: number) => void;
  setCenter: (latlng: KakaoLatLngClass) => void;
  getCenter: () => KakaoLatLngClass;
  getBounds: () => KakaoLatLngBoundsClass;
  setBounds: (bounds: KakaoLatLngBoundsClass) => void;
  getProjection: () => KakaoProjection;
}

export interface KakaoProjection {
  containerPointFromCoords: (latlng: KakaoLatLngClass) => { x: number; y: number };
  coordsFromContainerPoint: (point: { x: number; y: number }) => KakaoLatLngClass;
}

export interface KakaoMaps {
  load: (callback: () => void) => void;
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMapClass;
  LatLng: new (lat: number, lng: number) => KakaoLatLngClass;
  LatLngBounds: new () => KakaoLatLngBoundsClass;
  Marker: new (options: KakaoMarkerOptions) => KakaoMarkerClass;
  Polygon: new (options: KakaoPolygonOptions) => KakaoPolygonClass;
  CustomOverlay: new (
    options: KakaoCustomOverlayOptions,
  ) => KakaoCustomOverlayClass;
  event: {
    addListener: (
      target: unknown,
      type: string,
      handler: (...args: unknown[]) => void,
    ) => void;
    removeListener: (
      targetOrHandle: unknown,
      type?: string,
      handler?: (...args: unknown[]) => void,
    ) => void;
  };
  services: KakaoMapsServices;
}

export interface KakaoMapOptions {
  center: KakaoLatLngClass;
  level: number;
}

export interface KakaoMarkerOptions {
  position: KakaoLatLngClass;
  map?: KakaoMapClass;
}

export interface KakaoMarkerClass {
  setMap: (map: KakaoMapClass | null) => void;
}

export interface KakaoPolygonOptions {
  path: KakaoLatLngClass[];
  strokeWeight?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  fillColor?: string;
  fillOpacity?: number;
}

export interface KakaoPolygonClass {
  setMap: (map: KakaoMapClass | null) => void;
  setOptions: (options: Partial<KakaoPolygonOptions> | Record<string, unknown>) => void;
}

export interface KakaoCustomOverlayOptions {
  position: KakaoLatLngClass;
  content: string | HTMLElement;
  map?: KakaoMapClass;
  yAnchor?: number;
  zIndex?: number;
}

export interface KakaoCustomOverlayClass {
  setMap: (map: KakaoMapClass | null) => void;
}

interface Kakao {
  maps: KakaoMaps;
}

declare global {
  interface Window {
    kakao: Kakao;
  }
}

export {};