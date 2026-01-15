// =========================================
// AI Assistant 응답 스키마 (Structured Outputs)
// 프론트엔드 assistant-types.ts와 동기화 필요
// =========================================

export const FINAL_RESPONSE_SCHEMA_FOR_ACTION = {
  type: 'json_schema',
  name: 'final_response',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      reply: {
        type: 'string',
        description: '사용자에게 보여줄 답변 (Markdown 형식)',
      },
      actions: {
        type: 'array',
        description: 'UI 제어 명령 배열',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: [
                // 지도 액션 (실제 사용 중)
                'map.pan_to',
                'map.setLayer',
                'map.setMarkers',
                // UI 액션
                'ui.open_panel',
                // 차트 액션 (실제 사용 중)
                'chart.revenue',
                'chart.survival',
                'chart.breakeven',
                // 리스트 액션 (실제 사용 중)
                'list.listings',
                'list.similar_areas',
                // 매물 추천
                'real_estate.recommend',
              ],
              description: '실행할 액션 유형',
            },
            payload: {
              type: 'object',
              description: '액션에 필요한 파라미터 (사용하지 않는 값은 null)',
              properties: {
                // 지도 관련 필드
                lat: { type: ['number', 'null'] },
                lng: { type: ['number', 'null'] },
                zoom: { type: ['number', 'null'] },
                // 상권 정보 필드
                areaCode: { type: ['string', 'null'] },
                areaName: { type: ['string', 'null'] },
                level: {
                  type: ['string', 'null'],
                  enum: ['gu', 'dong', 'commercial', null],
                },
                // UI 패널 필드
                panelType: { type: ['string', 'null'] },
                // 업종 필드
                industryCode: { type: ['string', 'null'] },
                // 매물 관련 필드
                listingId: { type: ['string', 'null'] },
                maxDeposit: { type: ['number', 'null'] },
                maxMonthlyRent: { type: ['number', 'null'] },
                // map.setLayer 전용
                layer: {
                  type: ['string', 'null'],
                  enum: ['footTraffic', 'sales', null],
                },
                visible: { type: ['boolean', 'null'] },
                // map.setMarkers 전용
                markers: {
                  type: ['array', 'null'],
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: ['string', 'null'] },
                      lat: { type: 'number' },
                      lng: { type: 'number' },
                      label: { type: ['string', 'null'] },
                      type: {
                        type: ['string', 'null'],
                        enum: ['competitor', 'listing', 'default', null],
                      },
                    },
                    required: ['id', 'lat', 'lng', 'label', 'type'],
                    additionalProperties: false,
                  },
                },
              },
              // 필수 필드만 지정 (모든 필드를 required에서 제거하면 LLM 부담 감소)
              required: [
                'lat',
                'lng',
                'zoom',
                'areaCode',
                'areaName',
                'level',
                'panelType',
                'industryCode',
                'listingId',
                'maxDeposit',
                'maxMonthlyRent',
                'layer',
                'visible',
                'markers',
              ],
              additionalProperties: false,
            },
          },
          required: ['type', 'payload'],
          additionalProperties: false,
        },
      },
    },
    required: ['reply', 'actions'],
    additionalProperties: false,
  },
} as const;
