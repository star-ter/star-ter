export type OverlayMode = 'revenue' | 'population' | 'opening' | 'shutting';

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  coords: MapCoordinates;
  name: string;
  style?: 'default' | 'pulse';
}

export interface MapStore {
  center: MapCoordinates | null;
  zoom: number;
  searchedLocation: string | null;
  isMoving: boolean;
  isMapIdle: boolean;
  overlayMode: OverlayMode;
  selectedIndustryCodes: string[] | null;
  markers: MapMarker[];

  setCenter: (coords: MapCoordinates) => void;
  setZoom: (level: number) => void;
  setSearchedLocation: (location: string | null) => void;
  setIsMoving: (moving: boolean) => void;
  setIsMapIdle: (idle: boolean) => void;
  setOverlayMode: (mode: OverlayMode) => void;
  setSelectedIndustryCodes: (codes: string[] | null) => void;

  moveToLocation: (
    coords: MapCoordinates,
    location: string,
    zoom?: number,
    centered?: boolean,
  ) => void;
  moveToLocations: (locations: MapMarker[]) => void;
  clearMarkers: () => void;
  reset: () => void;
}
