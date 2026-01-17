import { type MarkerData } from '../types/markerTypes';
import { type AreaInfo } from '../types/mapTypes';
import { type PolygonData } from '../types';

export type MapCommand =
  | {
      type: 'map.pan_to';
      payload: {
        lat: number;
        lng: number;
        zoom?: number | null;
      };
    }
  | {
      type: 'map.setLayer';
      payload: {
        layer: string | null;
        visible?: boolean | null;
      };
    }
  | {
      type: 'map.setMarkers';
      payload: {
        markers: MarkerData[];
      };
    }
  | {
      type: 'map.showCommercialArea';
      payload: {
        area: AreaInfo;
        polygon: PolygonData;
      };
    };

export interface ActionDispatchPayload {
  mapCommands?: MapCommand[];
  openMapPanel?: boolean;
}
