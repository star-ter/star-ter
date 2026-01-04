export const tools = [
  {
    type: 'function',
    name: 'get_store',
    description: '상권 기본 요약 정보를 조회합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: 'areaCd 값을 이용하여 상권 정보를 가져온다.',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_foot_traffic',
    description: '유동인구 요약 정보를 조회합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: 'areaCd 값을 이용하여 유동인구 정보를 가져온다.',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_resident_population',
    description: '상주인구 요약 정보를 조회합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: 'areaCd 값을 이용하여 상주인구 정보를 가져온다.',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_working_population',
    description: '직장인구 요약 정보를 조회합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: 'areaCd 값을 이용하여 직장인구 정보를 가져온다.',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_sales_top_industries',
    description: '상권 내 업종별 매출 상위를 조회합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: 'areaCd 값을 이용하여 매출 상위 업종을 조회한다.',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_store_top_industries',
    description: '상권 내 업종별 점포/경쟁 상위를 조회합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: 'areaCd 값을 이용하여 점포 상위 업종을 조회한다.',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_income_consumption',
    description: '소득/소비 요약 정보를 조회합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: 'areaCd 값을 이용하여 소득/소비 정보를 가져온다.',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_commercial_change',
    description: '상권 변화지표 요약 정보를 조회합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: 'areaCd 값을 이용하여 상권 변화지표 정보를 가져온다.',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'compare_commercial_areas',
    description: '상권 2개 이상을 비교합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCdList: {
          type: 'array',
          items: { type: 'string' },
          description: '비교할 상권의 areaCd 목록입니다.',
        },
      },
      required: ['areaCdList'],
      additionalProperties: false,
    },
    strict: true,
  },
];
