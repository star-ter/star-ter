import { type AiAction } from '../../../lib/api/ai';
import { type ChatMapSectionRef } from '../ChatMapSection';

import { type MarkerData } from '../types/markerTypes';

export interface ActionContext {
  mapSection: ChatMapSectionRef | null;
  openMapPanel: () => void;
  setHeatmapVisible?: (visible: boolean) => void;
  setMarkers?: (markers: MarkerData[]) => void;
}

export interface ActionHandler {
  canHandle(type: string): boolean;
  handle(action: AiAction, context: ActionContext): Promise<void> | void;
}
