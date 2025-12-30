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
  overlayMode: 'revenue' | 'population' | 'opening';
  markers: MapMarker[];

  setCenter: (coords: MapCoordinates) => void;
  setZoom: (level: number) => void;
  setSearchedLocation: (location: string | null) => void;
  setIsMoving: (moving: boolean) => void;
  setOverlayMode: (mode: 'revenue' | 'population' | 'opening') => void;

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
