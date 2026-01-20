import { Injectable } from '@nestjs/common';
import { AiAction } from '../ai-response.processor';
import { ToolCall, ToolResult } from './ai-types';

@Injectable()
export class ActionMapperService {
  buildActions(toolCalls: ToolCall[], toolResults: ToolResult[]): AiAction[] {
    const resultById = new Map(
      toolResults.map((result) => [result.toolCallId, result]),
    );

    const actionByType = new Map<string, { index: number; action: AiAction }>();

    toolCalls.forEach((toolCall, index) => {
      const toolResult = resultById.get(toolCall.id);
      const action = this.mapToolCall(toolCall, toolResult);
      if (!action) return;

      actionByType.set(action.type, { index, action });
    });

    return Array.from(actionByType.values())
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.action);
  }

  private mapToolCall(
    toolCall: ToolCall,
    toolResult?: ToolResult,
  ): AiAction | null {
    switch (toolCall.name) {
      case 'estimate_revenue_and_cost':
        return this.buildAction('chart.revenue', toolCall.args);
      case 'predict_survival_rate':
        return this.buildAction('chart.survival', toolCall.args);
      case 'calc_break_even':
        return this.buildBreakEvenAction(toolCall.args);
      case 'calc_break_even_with_listing':
        return this.buildBreakEvenWithListingAction(toolCall.args);
      case 'find_similar_commercial_areas':
        return this.buildSimilarAreasAction(toolCall.args, toolResult);
      case 'recommend_real_estate':
        return this.buildListingAction(toolCall.args, toolResult);
      case 'get_store':
        return this.buildOpenPanelAction(toolCall.args);
      case 'get_industry_commercial_summary':
        return this.buildOpenPanelAction(toolCall.args, true);
      default:
        return null;
    }
  }

  private buildAction(
    type: string,
    args: Record<string, unknown>,
  ): AiAction | null {
    const payload: Record<string, unknown> = {};

    const areaCode = this.pickString(args.areaCd, args.areaCode);
    if (areaCode) payload.areaCode = areaCode;

    const industryCode = this.pickString(args.categoryCode, args.industryCode);
    if (industryCode) payload.industryCode = industryCode;

    if (!areaCode) return null;

    return { type, payload };
  }

  private buildBreakEvenAction(args: Record<string, unknown>): AiAction | null {
    const payload: Record<string, unknown> = {};

    const areaCode = this.pickString(args.areaCd, args.areaCode);
    if (areaCode) payload.areaCode = areaCode;

    const industryCode = this.pickString(args.categoryCode, args.industryCode);
    if (industryCode) payload.industryCode = industryCode;

    if (!areaCode) return null;

    return { type: 'chart.breakeven', payload };
  }

  private buildBreakEvenWithListingAction(
    args: Record<string, unknown>,
  ): AiAction | null {
    const payload: Record<string, unknown> = {};

    const listingId = this.pickString(args.listingId);
    if (listingId) payload.listingId = listingId;

    const industryCode = this.pickString(args.categoryCode, args.industryCode);
    if (industryCode) payload.industryCode = industryCode;

    if (!listingId) return null;

    return { type: 'chart.breakeven', payload };
  }

  private buildOpenPanelAction(
    args: Record<string, unknown>,
    includeIndustry = false,
  ): AiAction | null {
    const payload: Record<string, unknown> = {};

    const areaCode = this.pickString(args.areaCd, args.areaCode);
    if (areaCode) payload.areaCode = areaCode;

    if (includeIndustry) {
      const industryCode = this.pickString(
        args.categoryCode,
        args.industryCode,
      );
      if (industryCode) payload.industryCode = industryCode;
    }

    if (!areaCode) return null;

    return { type: 'ui.open_panel', payload };
  }

  private buildListingAction(
    args: Record<string, unknown>,
    toolResult?: ToolResult,
  ): AiAction | null {
    const payload: Record<string, unknown> = {};

    const lat = this.pickNumber(args.latitude, args.lat);
    const lng = this.pickNumber(args.longitude, args.lng);
    if (lat !== null) payload.lat = lat;
    if (lng !== null) payload.lng = lng;

    const maxDeposit = this.pickNumber(args.maxDeposit);
    if (maxDeposit !== null) payload.maxDeposit = maxDeposit;

    const maxMonthlyRent = this.pickNumber(args.maxMonthlyRent);
    if (maxMonthlyRent !== null) payload.maxMonthlyRent = maxMonthlyRent;

    const markers = this.extractListingMarkers(toolResult);
    if (markers.length > 0) payload.markers = markers;

    if (lat === null || lng === null) return null;

    return { type: 'list.listings', payload };
  }

  private buildSimilarAreasAction(
    args: Record<string, unknown>,
    toolResult?: ToolResult,
  ): AiAction | null {
    const action = this.buildAction('list.similar_areas', args);
    if (!action) return null;

    const markers = this.extractSimilarAreaMarkers(toolResult);
    if (markers.length > 0) {
      action.payload = {
        ...(action.payload ?? {}),
        markers,
      };
    }

    return action;
  }

  private extractListingMarkers(toolResult?: ToolResult): ListingMarker[] {
    if (!toolResult) return [];

    const parsed = this.parseResult(toolResult);
    if (!parsed || typeof parsed !== 'object') return [];

    const data = (parsed as { data?: unknown }).data;
    if (!Array.isArray(data)) return [];

    return data
      .map((item): ListingMarker | null => {
        if (!item || typeof item !== 'object') return null;
        const record = item as Record<string, unknown>;

        const lat = this.pickNumber(record.latitude, record.lat);
        const lng = this.pickNumber(record.longitude, record.lng);
        if (lat === null || lng === null) return null;

        const listingNumber = this.pickNumber(record.listingNumber);
        const label = listingNumber != null ? String(listingNumber) : undefined;

        const idValue =
          record.listingId ?? record.id ?? record.listingNumber ?? undefined;
        if (!idValue) return null;

        return {
          id: String(idValue),
          lat,
          lng,
          label,
          type: 'listing' as const,
          listingNumber: listingNumber ?? undefined,
          title: typeof record.title === 'string' ? record.title : undefined,
        };
      })
      .filter((marker): marker is ListingMarker => marker !== null);
  }

  private extractSimilarAreaMarkers(
    toolResult?: ToolResult,
  ): SimilarAreaMarker[] {
    if (!toolResult) return [];

    const parsed = this.parseResult(toolResult);
    if (!parsed || typeof parsed !== 'object') return [];

    const data = (parsed as { data?: unknown }).data;
    if (!Array.isArray(data)) return [];

    return data
      .map((item, index): SimilarAreaMarker | null => {
        if (!item || typeof item !== 'object') return null;
        const record = item as Record<string, unknown>;

        const lat = this.pickNumber(record.lat, record.latitude);
        const lng = this.pickNumber(record.lng, record.longitude);
        if (lat === null || lng === null) return null;

        const idValue = record.areaCd ?? record.areaCode ?? record.id ?? null;
        if (!idValue) return null;

        return {
          id: String(idValue),
          lat,
          lng,
          label: String(index + 1),
          type: 'default' as const,
        };
      })
      .filter((marker): marker is SimilarAreaMarker => marker !== null);
  }

  private parseResult(toolResult: ToolResult): unknown {
    if (toolResult.outputJson) {
      try {
        return JSON.parse(toolResult.outputJson) as unknown;
      } catch {
        return toolResult.output;
      }
    }

    return toolResult.output;
  }

  private pickString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value;
    }
    return null;
  }

  private pickNumber(...values: unknown[]): number | null {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return null;
  }
}

interface ListingMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  type: 'listing';
  listingNumber?: number;
  title?: string;
}

interface SimilarAreaMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  type: 'default';
}
