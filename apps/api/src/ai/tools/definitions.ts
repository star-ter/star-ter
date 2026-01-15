export const TOOLS = [
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
  {
    type: 'function',
    name: 'get_industry_commercial_summary',
    description: '특정 상권에서 특정 업종의 매출/점포/인구 요약을 조회합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: '조회할 상권의 areaCd입니다.',
        },
        categoryCode: {
          type: 'string',
          description: '조회할 업종 코드(svc_induty_cd)입니다.',
        },
      },
      required: ['areaCd', 'categoryCode'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'recommend_commercial_by_industry',
    description:
      '사용자의 선호도(타겟 연령대, 자본금, 선호 지역 등)를 기반으로 맞춤형 상권을 추천합니다. "나한테 맞는 상권 추천해줘", "치킨집 창업하기 좋은 곳 추천" 등의 질문에 사용하세요.',
    parameters: {
      type: 'object',
      properties: {
        categoryCode: {
          type: 'string',
          description:
            '추천할 업종 코드(svc_induty_cd)입니다. 선택 사항입니다.',
        },
        userId: {
          type: 'string',
          description:
            '로그인된 사용자 ID (UUID). 제공되면 DB에서 선호도를 조회합니다.',
        },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: 'function',
    name: 'find_similar_commercial_areas',
    description:
      '특정 상권과 유사한 상권을 찾습니다. "서울대입구역이랑 비슷한 곳", "여기랑 비슷한 상권 추천" 등의 질문에 사용하세요. 연령대, 시간대, 인구 구성이 유사한 상권을 추천합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: '기준 상권 코드 (유사 상권을 찾을 대상)',
        },
        limit: {
          type: 'number',
          description: '반환할 유사 상권 수 (기본 5)',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: 'function',
    name: 'compare_commercial_by_industry',
    description: '특정 업종 기준으로 여러 상권을 비교합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCodes: {
          type: 'array',
          items: { type: 'string' },
          description: '비교할 상권의 areaCd 목록입니다.',
        },
        categoryCode: {
          type: 'string',
          description: '비교할 업종 코드(svc_induty_cd)입니다.',
        },
      },
      required: ['areaCodes', 'categoryCode'],
      additionalProperties: false,
    },
    strict: true,
  },

  {
    type: 'function',
    name: 'get_foot_traffic_timeseries',
    description:
      '상권의 분기별 유동인구 추이(시계열 데이터)를 조회합니다. 차트를 그릴 때 사용합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: '조회할 상권의 areaCd입니다.',
        },
        limit: {
          type: 'number',
          description: '조회할 최근 분기 개수 (기본값: 8)',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: 'function',
    name: 'get_foot_traffic_detail',
    description:
      '상권의 시간대별(0~24시), 요일별(월~일) 유동인구 상세 데이터를 조회합니다. 언제 사람이 가장 많은지 분석할 때 사용합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: '조회할 상권의 areaCd입니다.',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_competition_analysis',
    description:
      '특정 상권/업종의 경쟁 강도(점포 수, 프랜차이즈 비율, 폐업률)를 분석합니다. *주의: 단순 경쟁 현황이 아닌, 구체적인 생존 점수나 확률이 궁금하다면 predict_survival_rate를 사용하세요.*',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: '조회할 상권의 areaCd입니다.',
        },
        categoryCode: {
          type: 'string',
          description: '조회할 업종 코드(svc_induty_cd)입니다.',
        },
      },
      required: ['areaCd', 'categoryCode'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_commercial_risk',
    description:
      '상권의 등급(활성화/침체 등)과 평균 영업 지속 기간을 조회합니다. 상권 전체의 리스크를 볼 때 사용합니다. *주의: 특정 업종의 구체적인 생존 확률(점수)을 물어볼 때는 predict_survival_rate를 사용하세요.*',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: '조회할 상권의 areaCd입니다.',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'estimate_revenue_and_cost',
    description:
      '사용자가 "얼마 벌어?", "수익", "순수익", "창업하면" 등의 질문을 할 때 반드시 이 도구를 사용해야 합니다! 상권/업종의 예상 매출과 비용(임대료)을 분석하여 추정 순수익을 계산합니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: '조회할 상권의 areaCd입니다.',
        },
        categoryCode: {
          type: 'string',
          description: '조회할 업종 코드(svc_induty_cd)입니다.',
        },
        deposit: {
          type: 'number',
          description: '매물의 보증금 (단위: 만원). 선택 사항입니다.',
        },
        monthlyRent: {
          type: 'number',
          description: '매물의 월세 (단위: 만원). 선택 사항입니다.',
        },
        size: {
          type: 'number',
          description: '매물의 평수 (단위: 평). 기본값은 15평입니다.',
        },
        floor: {
          type: 'number',
          description: '매물의 층수. 기본값은 1층입니다.',
        },
      },
      required: ['areaCd', 'categoryCode'],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: 'function',
    name: 'calc_break_even',
    description:
      '손익분기점(BEP: Break-Even Point)을 계산합니다. 업종별 평균 비용(재료비, 인건비 등)과 임대료를 고려하여, 적자를 면하기 위해 월 얼마를 벌어야 하는지 분석합니다. "얼마 팔아야 본전이야?", "손익분기 알려줘" 등의 질문에 사용하세요.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: '상권 코드 (예: "3120189")',
        },
        categoryCode: {
          type: 'string',
          description: '업종 코드 (예: "CS100010")',
        },
        monthlyRent: {
          type: 'number',
          description: '월세 (단위: 만원)',
        },
        deposit: {
          type: 'number',
          description: '보증금 (단위: 만원)',
        },
        size: {
          type: 'number',
          description: '매장 크기 (평)',
        },
        floor: {
          type: 'number',
          description: '층수',
        },
      },
      required: ['areaCd'],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: 'function',
    name: 'predict_survival_rate',
    description:
      '***[강력 추천]*** "살아남을 수 있을까?", "망할 확률은?", "생존 가능성" 등의 질문에 사용하세요. 단순 경쟁 현황이 아니라, 폐업률과 영업지속기간을 종합 분석하여 생존 가능성을 **점수(Score)**로 예측해 줍니다.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: '상권 코드 (예: "3120189")',
        },
        categoryCode: {
          type: 'string',
          description: '업종 코드 (예: "CS100010")',
        },
        stdrYyquCd: {
          type: 'string',
          description: '기준 분기 코드 (기본값: "20243")',
        },
      },
      required: ['areaCd', 'categoryCode'],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: 'function',
    name: 'recommend_real_estate',
    description:
      '현재 보고 있는 위치 근처의 부동산 매물을 추천합니다. "여기 근처 500/30 매물 있어?", "보증금 1억 이하 매물 찾아줘" 등의 요청에 사용하세요. 지도 중심 좌표(latitude, longitude)를 기반으로 검색합니다.',
    parameters: {
      type: 'object',
      properties: {
        latitude: {
          type: 'number',
          description: '검색 중심 위도',
        },
        longitude: {
          type: 'number',
          description: '검색 중심 경도',
        },
        maxDeposit: {
          type: 'number',
          description: '최대 보증금 (단위: 만원)',
        },
        maxMonthlyRent: {
          type: 'number',
          description: '최대 월세 (단위: 만원)',
        },
        minSize: {
          type: 'number',
          description: '최소 평수 (단위: 평)',
        },
        limit: {
          type: 'number',
          description: '최대 검색 개수 (기본 5개)',
        },
      },
      required: ['latitude', 'longitude'],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: 'function',
    name: 'get_funding_programs',
    description:
      '소상공인 정책자금, 대출, 창업 지원금 정보를 조회합니다. "대출", "정부 지원", "창업 자금" 등의 질문에 사용하세요.',
    parameters: {
      type: 'object',
      properties: {
        areaCd: {
          type: 'string',
          description: '상권 코드 (선택 사항)',
        },
        categoryCode: {
          type: 'string',
          description: '업종 코드 (선택 사항)',
        },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: 'function',
    name: 'request_report_generation',
    description:
      '사용자가 분석 결과나 대화 내용을 "리포트(보고서)로 만들어줘", "PDF로 저장해줘"라고 요청할 때 사용합니다. 이 도구는 실제 데이터를 조회하지 않고 리포트 생성 프로세스를 트리거합니다.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description:
            '리포트 제목 (예: "서울대입구역 아메리카노 상권 분석 보고서")',
        },
      },
      required: [],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: 'function',
    name: 'calc_break_even_with_listing',
    description:
      '특정 부동산 매물의 임대료 정보를 바탕으로 손익분기점을 계산합니다. "이 매물에서 장사하면 얼마나 팔아야 해?" 등의 질문에 사용하세요.',
    parameters: {
      type: 'object',
      properties: {
        listingId: {
          type: 'string',
          description: '부동산 매물 ID (action payload에 포함된 id)',
        },
        categoryCode: {
          type: 'string',
          description: '업종 코드 (예: "CS100010")',
        },
      },
      required: ['listingId', 'categoryCode'],
      additionalProperties: false,
    },
    strict: false,
  },
];
