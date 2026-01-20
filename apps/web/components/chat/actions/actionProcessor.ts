import { type AiAction } from '@/lib/api/ai';
import {
  type ChartItem,
  type ChartActionType,
  type ChartPayload,
} from '../charts/types';
import { type MapCommand } from './commandTypes';
import { type MarkerData } from '../types/markerTypes';
import { type AreaInfo } from '../types/mapTypes';
import { type PolygonData } from '../types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export interface ChartItemUpdate {
  id: string;
  data: unknown | null;
  error?: string;
}

export interface ActionPlan {
  chartItems: ChartItem[];
  chartItemUpdates: Promise<ChartItemUpdate>[];
  mapCommands: MapCommand[];
  mapCommandUpdates: Promise<MapCommand[]>[];
  openMapPanel: boolean;
  contentWithMarkers: string;
}

export function processAiActions(params: {
  reply: string;
  actions?: AiAction[];
}): ActionPlan {
  const actions = params.actions ?? [];
  const chartItems: ChartItem[] = [];
  const chartItemUpdates: Promise<ChartItemUpdate>[] = [];
  const mapCommands: MapCommand[] = [];
  const mapCommandUpdates: Promise<MapCommand[]>[] = [];
  let openMapPanel = false;

  let listingMarkersForHistory: unknown[] | null = null;

  for (const action of actions) {
    if (isChartActionType(action.type)) {
      const payload = coerceChartPayload(action.payload);
      const item: ChartItem = {
        id: crypto.randomUUID(),
        type: action.type,
        payload,
        data: null,
        isLoading: true,
      };
      chartItems.push(item);
      chartItemUpdates.push(fetchChartData(item));

      if (action.type === 'list.listings') {
        const panCommand = buildPanCommand(payload);
        if (panCommand) {
          mapCommands.push(panCommand);
          openMapPanel = true;
        }
        if (Array.isArray(payload.markers)) {
          listingMarkersForHistory = payload.markers as unknown[];
          const markers = normalizeMarkers(payload.markers);
          mapCommands.push({
            type: 'map.setMarkers',
            payload: { markers },
          });
          openMapPanel = true;
        }
      }
      if (action.type === 'list.similar_areas') {
        if (Array.isArray(payload.markers)) {
          const markers = normalizeMarkers(payload.markers);
          if (markers.length > 0) {
            mapCommands.push({
              type: 'map.setMarkers',
              payload: { markers, fitBounds: true },
            });
            openMapPanel = true;
          }
        }
      }
      continue;
    }

    if (action.type === 'map.pan_to') {
      const payload = coercePayload(action.payload);
      const panCommand = buildPanCommand(payload);
      if (panCommand) {
        mapCommands.push(panCommand);
        openMapPanel = true;
      }
      continue;
    }

    if (action.type === 'map.setLayer') {
      const payload = coercePayload(action.payload);
      const panCommand = buildPanCommand(payload);
      if (panCommand) {
        mapCommands.push(panCommand);
        openMapPanel = true;
      }
      mapCommands.push({
        type: 'map.setLayer',
        payload: {
          layer: typeof payload.layer === 'string' ? payload.layer : null,
          visible:
            typeof payload.visible === 'boolean' ? payload.visible : undefined,
        },
      });
      openMapPanel = true;
      continue;
    }

    if (action.type === 'map.setMarkers') {
      const payload = coercePayload(action.payload);
      if (Array.isArray(payload.markers)) {
        const panCommand = buildPanCommand(payload);
        if (panCommand) {
          mapCommands.push(panCommand);
          openMapPanel = true;
        }
        const markers = normalizeMarkers(payload.markers);
        mapCommands.push({
          type: 'map.setMarkers',
          payload: { markers },
        });
        openMapPanel = true;
      }
      continue;
    }

    if (action.type === 'ui.open_panel') {
      const payload = coercePayload(action.payload);
      const panCommand = buildPanCommand(payload);
      if (panCommand) {
        mapCommands.push(panCommand);
        openMapPanel = true;
      }
      if (payload.areaCode) {
        mapCommandUpdates.push(
          fetchCommercialArea(String(payload.areaCode), payload.areaName),
        );
      }
      openMapPanel = true;
    }
  }

  const contentWithMarkers = appendMarkersToReply(
    params.reply,
    listingMarkersForHistory,
  );

  if (mapCommands.length > 0 || mapCommandUpdates.length > 0) {
    openMapPanel = true;
  }

  return {
    chartItems,
    chartItemUpdates,
    mapCommands,
    mapCommandUpdates,
    openMapPanel,
    contentWithMarkers,
  };
}

const chartActionTypes: ChartActionType[] = [
  'chart.revenue',
  'chart.survival',
  'chart.breakeven',
  'list.listings',
  'list.similar_areas',
];

function isChartActionType(type: string): type is ChartActionType {
  return (chartActionTypes as string[]).includes(type);
}

function coercePayload(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object') {
    return payload as Record<string, unknown>;
  }
  return {};
}

function coerceChartPayload(payload: unknown): ChartPayload {
  return coercePayload(payload) as ChartPayload;
}

async function fetchChartData(item: ChartItem): Promise<ChartItemUpdate> {
  try {
    const { type, payload } = item;
    const params = new URLSearchParams();

    if (payload.areaCode) params.set('areaCd', String(payload.areaCode));
    if (payload.industryCode) {
      params.set('categoryCode', String(payload.industryCode));
    }
    if (payload.listingId) params.set('listingId', String(payload.listingId));

    let endpoint = '';
    if (type === 'chart.revenue') {
      endpoint = `${API_BASE_URL}/ai/chart/revenue`;
    } else if (type === 'chart.survival') {
      endpoint = `${API_BASE_URL}/ai/chart/survival`;
    } else if (type === 'chart.breakeven') {
      endpoint = `${API_BASE_URL}/ai/chart/breakeven`;
    } else if (type === 'list.listings') {
      endpoint = `${API_BASE_URL}/ai/chart/listings`;
      const lat = firstNumber(payload.lat, payload.latitude);
      const lng = firstNumber(payload.lng, payload.longitude);
      if (lat === null || lng === null) {
        return {
          id: item.id,
          data: null,
          error: '데이터를 불러올 수 없습니다.',
        };
      }
      params.set('latitude', String(lat));
      params.set('longitude', String(lng));
      if (payload.maxDeposit != null) {
        params.set('maxDeposit', String(payload.maxDeposit));
      }
      if (payload.maxMonthlyRent != null) {
        params.set('maxMonthlyRent', String(payload.maxMonthlyRent));
      }
    } else if (type === 'list.similar_areas') {
      endpoint = `${API_BASE_URL}/ai/chart/similar-areas`;
    } else {
      return {
        id: item.id,
        data: null,
        error: '데이터를 불러올 수 없습니다.',
      };
    }

    const response = await fetch(`${endpoint}?${params.toString()}`);
    const result = await response.json();

    if (result?.success) {
      return { id: item.id, data: result.data ?? null };
    }
    return {
      id: item.id,
      data: null,
      error: '데이터를 불러올 수 없습니다.',
    };
  } catch (error) {
    console.error('Chart data fetch error:', error);
    return {
      id: item.id,
      data: null,
      error: '데이터를 불러오는 중 오류가 발생했습니다.',
    };
  }
}

async function fetchCommercialArea(
  areaCode: string,
  areaNameFromPayload: unknown,
): Promise<MapCommand[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/polygon/commercial/code?code=${encodeURIComponent(areaCode)}`,
    );
    if (!response.ok) return [];

    const data = await response.json();
    if (!data || !data.polygons) return [];

    const polygon: PolygonData = {
      type: data.polygons.type,
      coordinates: data.polygons.coordinates,
    };

    const fallbackName =
      typeof areaNameFromPayload === 'string' && areaNameFromPayload
        ? areaNameFromPayload
        : areaCode;

    const areaNameValue =
      data.properties?.commercialName ?? data.properties?.commercialname;
    const areaName = areaNameValue ? String(areaNameValue) : fallbackName;

    const areaInfo: AreaInfo = {
      code: areaCode,
      name: areaName,
      type: 'commercial',
    };

    try {
      const summaryResponse = await fetch(
        `${API_BASE_URL}/ai/area/summary?areaCd=${encodeURIComponent(areaCode)}`,
      );
      const summaryData = await summaryResponse.json();

      if (summaryData?.success && summaryData?.data) {
        areaInfo.name = summaryData.data.areaName || areaInfo.name;
        areaInfo.revenue = summaryData.data.revenue;
        areaInfo.floatingPopulation = summaryData.data.floatingPopulation;
        areaInfo.storeCount = summaryData.data.storeCount;
      }
    } catch (error) {
      console.error('Failed to load area summary:', error);
    }

    return [
      {
        type: 'map.showCommercialArea',
        payload: {
          area: areaInfo,
          polygon,
        },
      },
    ];
  } catch (error) {
    console.error('Failed to load commercial polygon:', error);
    return [];
  }
}

function normalizeMarkers(rawMarkers: unknown): MarkerData[] {
  if (!Array.isArray(rawMarkers)) return [];

  return rawMarkers
    .map((marker, index) => {
      if (!marker || typeof marker !== 'object') return null;

      const markerRecord = marker as Record<string, unknown>;
      const lat = firstNumber(markerRecord.lat, markerRecord.latitude);
      const lng = firstNumber(markerRecord.lng, markerRecord.longitude);
      if (lat === null || lng === null) return null;

      const idValue =
        markerRecord.id ??
        markerRecord.listingId ??
        markerRecord.listingNumber ??
        `marker-${index}`;
      const id = String(idValue);

      const labelValue =
        typeof markerRecord.label === 'string'
          ? markerRecord.label
          : markerRecord.listingNumber != null
            ? String(markerRecord.listingNumber)
            : undefined;

      const typeValue =
        typeof markerRecord.type === 'string' ? markerRecord.type : 'default';
      const type = normalizeMarkerType(typeValue);

      const meta: Record<string, unknown> = {};
      if (markerRecord.listingNumber != null) {
        meta.listingNumber = markerRecord.listingNumber;
      }
      if (markerRecord.title != null) {
        meta.title = markerRecord.title;
      }

      return {
        id,
        lat,
        lng,
        label: labelValue,
        type,
        meta: Object.keys(meta).length > 0 ? meta : undefined,
      } as MarkerData;
    })
    .filter((marker): marker is MarkerData => marker !== null);
}

function normalizeMarkerType(type: string): MarkerData['type'] {
  if (type === 'competitor' || type === 'listing' || type === 'default') {
    return type;
  }
  return 'default';
}



type PanPayload = {
  lat?: unknown;
  lng?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  zoom?: unknown;
};

function buildPanCommand(payload: PanPayload): MapCommand | null {
  const lat = firstNumber(payload.lat, payload.latitude);
  const lng = firstNumber(payload.lng, payload.longitude);
  if (lat === null || lng === null) return null;

  return {
    type: 'map.pan_to',
    payload: {
      lat,
      lng,
      zoom: toNumber(payload.zoom),
    },
  };
}

function appendMarkersToReply(reply: string, markers: unknown[] | null) {
  if (!markers || markers.length === 0) return reply;
  return `${reply}\n\n[매물 목록 참조용 - 이 메시지는 사용자에게 보이지 않습니다]\n${JSON.stringify(markers)}`;
}

function firstNumber(value: unknown, fallback: unknown): number | null {
  const primary = toNumber(value);
  if (primary !== null) return primary;
  return toNumber(fallback);
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  return null;
}
