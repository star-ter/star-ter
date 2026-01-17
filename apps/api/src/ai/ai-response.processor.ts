import { Injectable } from '@nestjs/common';

@Injectable()
export class AiResponseProcessor {
  /**
   * Safely parses the AI response text into JSON.
   * Handles markdown code blocks (```json ... ```) and extra text.
   */
  parseResponse(text: string): AiResponse {
    try {
      // 1. Try direct parsing
      const parsed = JSON.parse(text) as unknown;
      if (this.isAiResponse(parsed)) {
        return parsed;
      }
    } catch {
      // 2. Try extracting JSON from markdown or mixed text
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = this.extractBalancedJson(text, jsonMatch.index || 0);
          const parsed = JSON.parse(jsonStr) as unknown;
          if (this.isAiResponse(parsed)) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('[AiResponseProcessor] Failed to extract JSON:', e);
      }
    }
    // Fallback: treat as plain text reply
    return { reply: text };
  }

  private isAiResponse(data: unknown): data is AiResponse {
    if (typeof data !== 'object' || data === null) return false;
    const response = data as AiResponse;
    return (
      typeof response.reply === 'string' ||
      (Array.isArray(response.actions) &&
        response.actions.every((a) => typeof a.type === 'string'))
    );
  }

  /**
   * Extracts a balanced JSON object starting from a given index.
   */
  private extractBalancedJson(text: string, startIndex: number): string {
    let balance = 0;
    let end = -1;
    let inString = false;
    let escape = false;

    for (let i = startIndex; i < text.length; i++) {
      const char = text[i];

      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          balance++;
        } else if (char === '}') {
          balance--;
          if (balance === 0) {
            end = i;
            break;
          }
        }
      }
    }

    if (end !== -1) {
      return text.substring(startIndex, end + 1);
    }
    throw new Error('Unbalanced JSON');
  }

  /**
   * Patches coordinates in AI actions using the provided area list.
   */
  patchCoordinates(response: AiResponse, areaList: AreaInfo[]): string {
    if (!response.actions || !Array.isArray(response.actions)) {
      return JSON.stringify(response);
    }

    response.actions.forEach((action) => {
      // Patch coordinates for actions that need them
      if (action.payload?.areaName) {
        const targetAreaName = action.payload.areaName;

        // Find area in the list
        const foundArea =
          areaList.find((a) => a.areaName === targetAreaName) || areaList[0];

        if (foundArea && foundArea.lat && foundArea.lng) {
          // Check if we need to patch (missing coords or explicit override needed)
          if (
            !action.payload.lat ||
            !action.payload.lng ||
            action.type === 'ui.open_panel'
          ) {
            // Check if names match to avoid patching wrong area
            if (foundArea.areaName === targetAreaName) {
              action.payload.lat = foundArea.lat;
              action.payload.lng = foundArea.lng;

              console.log(
                `[AiResponseProcessor] Patched coords for ${targetAreaName}`,
              );
            }
          }
        }
      }

      // [신규] ui.open_panel 액션에서 areaCode로 좌표 패치 (Claude는 좌표 없이 areaCode만 보냄)
      if (
        action.type === 'ui.open_panel' &&
        action.payload?.areaCode &&
        (!action.payload.lat || !action.payload.lng)
      ) {
        const targetAreaCode = String(action.payload.areaCode);
        // areaList에서 areaCode로 찾기
        const foundArea = areaList.find((a) => a.areaCode === targetAreaCode);

        if (foundArea && foundArea.lat && foundArea.lng) {
          action.payload.lat = foundArea.lat;
          action.payload.lng = foundArea.lng;
          console.log(
            `[AiResponseProcessor] Patched coords for areaCode ${targetAreaCode}: lat=${foundArea.lat}, lng=${foundArea.lng}`,
          );
        } else {
          console.warn(
            `[AiResponseProcessor] Could not find coords for areaCode ${targetAreaCode}`,
          );
        }
      }

      // 카카오 지도 줌 레벨 고정 (숫자가 작을수록 확대)
      // ui.open_panel 또는 map 관련 액션일 때 zoom을 4으로 고정
      if (action.type === 'ui.open_panel' || action.type?.startsWith('map.')) {
        action.payload = action.payload || {};
        action.payload.zoom = 4; // 카카오 지도 상권 레벨
      }
    });

    // Always return stringified JSON
    return JSON.stringify(response);
  }

  /**
   * Helper for JSON.stringify to handle BigInt
   */
  safeBigIntStringify(_key: string, value: unknown) {
    return typeof value === 'bigint' ? value.toString() : value;
  }
}

export interface AiActionPayload {
  areaName?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  [key: string]: unknown;
}

export interface AiAction {
  type: string;
  payload?: AiActionPayload;
}

export interface SourceInfo {
  tool: string;
  displayName: string;
  source: string;
}

export interface AiResponse {
  reply?: string;
  actions?: AiAction[];
  sources?: SourceInfo[];
}

export interface AreaInfo {
  areaName: string;
  areaCode?: string; // 상권 코드 (좌표 조회용)
  lat?: number;
  lng?: number;
  [key: string]: unknown; // Allow other properties from AreaVectorDto
}
