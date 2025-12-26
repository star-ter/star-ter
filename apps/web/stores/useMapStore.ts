import { create } from 'zustand';

interface MapCoordinates {
  lat: number;
  lng: number;
}

interface MapMarker {
  id: string;
  coords: MapCoordinates;
  name: string;
}

interface MapStore {
  center: MapCoordinates | null;
  zoom: number;
  searchedLocation: string | null;
  isMoving: boolean;
  markers: MapMarker[];

  setCenter: (coords: MapCoordinates) => void;
  setZoom: (level: number) => void;
  setSearchedLocation: (location: string | null) => void;
  setIsMoving: (moving: boolean) => void;
  
  moveToLocation: (coords: MapCoordinates, location: string, zoom?: number) => void;
  moveToLocations: (locations: MapMarker[]) => void;
  clearMarkers: () => void;
  reset: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  center: null,
  zoom: 3,
  searchedLocation: null,
  isMoving: false,
  markers: [],

  setCenter: (coords) => set({ center: coords }),
  setZoom: (level) => set({ zoom: level }),
  setSearchedLocation: (location) => set({ searchedLocation: location }),
  setIsMoving: (moving) => set({ isMoving: moving }),

  moveToLocation: (coords, location, zoom = 3) => {
    set({
      center: coords,
      zoom,
      searchedLocation: location,
      isMoving: true,
      markers: [{ id: '1', coords, name: location }],
    });
    
    setTimeout(() => set({ isMoving: false }), 500);
  },

  moveToLocations: (locations) => {
    if (locations.length === 0) return;

    // 중심점 계산 (모든 좌표의 평균)
    const avgLat = locations.reduce((sum, loc) => sum + loc.coords.lat, 0) / locations.length;
    const avgLng = locations.reduce((sum, loc) => sum + loc.coords.lng, 0) / locations.length;

    set({
      center: { lat: avgLat, lng: avgLng },
      zoom: -1, // -1은 "자동 bounds 맞춤" 신호
      searchedLocation: locations.map(l => l.name).join(', '),
      isMoving: true,
      markers: locations,
    });
    
    setTimeout(() => set({ isMoving: false }), 500);
  },

  clearMarkers: () => set({ markers: [] }),

  reset: () =>
    set({
      center: null,
      zoom: 3,
      searchedLocation: null,
      isMoving: false,
      markers: [],
    }),
}));

