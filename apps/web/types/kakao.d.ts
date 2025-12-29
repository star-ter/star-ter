interface KakaoMapsServices {
  Geocoder: new () => {
    addressSearch: (
      address: string,
      callback: (result: KakaoGeocoderResult[], status: string) => void,
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

interface KakaoGeocoderResult {
  x: string;
  y: string;
  address_name: string;
  road_address?: {
    address_name: string;
    building_name?: string;
  };
}

interface KakaoPlaceResult {
  x: string;
  y: string;
  place_name: string;
  address_name: string;
  road_address_name?: string;
}

interface KakaoLatLngClass {
  getLat: () => number;
  getLng: () => number;
}

interface KakaoLatLngBoundsClass {
  extend: (latlng: KakaoLatLngClass) => void;
  getSouthWest: () => KakaoLatLngClass;
  getNorthEast: () => KakaoLatLngClass;
  contain: (latlng: KakaoLatLngClass) => boolean;
}

interface KakaoMapClass {
  getLevel: () => number;
  setLevel: (level: number) => void;
  setCenter: (latlng: KakaoLatLngClass) => void;
  getCenter: () => KakaoLatLngClass;
  getBounds: () => KakaoLatLngBoundsClass;
  setBounds: (bounds: KakaoLatLngBoundsClass) => void;
}

interface KakaoMaps {
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
      target: KakaoMapClass | KakaoPolygonClass,
      type: string,
      handler: () => void,
    ) => void;
    removeListener: (
      target: KakaoMapClass | KakaoPolygonClass,
      type: string,
      handler: () => void,
    ) => void;
  };
  services: KakaoMapsServices;
}

interface KakaoMapOptions {
  center: KakaoLatLngClass;
  level: number;
}

interface KakaoMarkerOptions {
  position: KakaoLatLngClass;
  map?: KakaoMapClass;
}

interface KakaoMarkerClass {
  setMap: (map: KakaoMapClass | null) => void;
}

interface KakaoPolygonOptions {
  path: KakaoLatLngClass[];
  strokeWeight?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  fillColor?: string;
  fillOpacity?: number;
}

interface KakaoPolygonClass {
  setMap: (map: KakaoMapClass | null) => void;
  setOptions: (options: Partial<KakaoPolygonOptions>) => void;
}

interface KakaoCustomOverlayOptions {
  position: KakaoLatLngClass;
  content: string | HTMLElement;
  map?: KakaoMapClass;
  yAnchor?: number;
  zIndex?: number;
}

interface KakaoCustomOverlayClass {
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
