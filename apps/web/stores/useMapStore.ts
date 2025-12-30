import { create } from 'zustand';
import { MapStore } from '../types/map-store-types';

export const useMapStore = create<MapStore>((set) => ({
  center: null,
  zoom: 3,
  searchedLocation: null,
  isMoving: false,
  overlayMode: 'revenue',
  markers: [],

  setCenter: (coords) => set({ center: coords }),
  setZoom: (level) => set({ zoom: level }),
  setSearchedLocation: (location) => set({ searchedLocation: location }),
  setIsMoving: (moving) => set({ isMoving: moving }),
  setOverlayMode: (mode) => set({ overlayMode: mode }),

  moveToLocation: (coords, location, zoom = 3, centered = false) => {
    set({
      center: coords,
      zoom: centered ? -2 : zoom,
      searchedLocation: location,
      isMoving: true,
      markers: [{ id: '1', coords, name: location, style: 'pulse' }],
    });

    setTimeout(() => set({ isMoving: false }), 1300);
  },

  moveToLocations: (locations) => {
    if (locations.length === 0) return;

    const avgLat =
      locations.reduce((sum, loc) => sum + loc.coords.lat, 0) /
      locations.length;
    const avgLng =
      locations.reduce((sum, loc) => sum + loc.coords.lng, 0) /
      locations.length;

    set({
      center: { lat: avgLat, lng: avgLng },
      zoom: -1,
      searchedLocation: locations.map((l) => l.name).join(', '),
      isMoving: true,
      markers: locations,
    });

    setTimeout(() => set({ isMoving: false }), 1300);
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
