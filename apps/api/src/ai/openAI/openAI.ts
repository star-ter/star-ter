import OpenAI from 'openai';
import { AreaVectorDto, BusinessCategoryVectorDto } from '../dto/column-vector';
import { ResponseInput, Tool } from 'openai/resources/responses/responses.js';

// Singleton OpenAI client
class OpenAIClient {
  private static client: OpenAI;
  static getClient() {
    if (!this.client) {
      this.client = new OpenAI();
    }
    return this.client;
  }
}

export function getText(response: OpenAI.Responses.Response) {
  return response?.output_text || '';
}

export function embedText(text: string) {
  return OpenAIClient.getClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
}

export function getCategoryByMessage(message: string) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: message,
    temperature: 0,
    instructions: `
            사용자 질의에 있는 업종을 분석하여 뽑아주세요 여러 업종이 있을 경우 ,로 구분하여 나열해주세요
            업종이 없을 경우 "" 빈문자열을 반환해주세요
            ex) "홍대에서 잘나가는 업종 알려줘" -> ""
            ex) "서울시 강남구에서 음식점과 카페 매출 알려줘" -> "음식점, 카페"
            ex) "한식 음식점이 잘 팔리는 상권은 어디야?" -> "한식 음식점"
            ex) "한식과 일식 매출 비교해줘" -> "한식, 일식"
    `,
  });
}

export function getLocationByMessage(message: string) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: message,
    temperature: 0,
    instructions: `
            사용자 질의에 있는 위치 정보를 분석하여 뽑아주세요 여러 위치가 있을 경우 ,로 구분하여 나열해주세요
            위치 정보 단계는 [시, 자치구, 행정동, 상권]이 있습니다. 문맥을 파악하여 적절한 단계로 뽑아주세요
            위치 정보가 없을 경우 빈문자열을 반환해주세요
            ex) "홍대에서 잘나가는 업종 알려줘" -> "홍대"
            ex) "강남구에서 음식점과 카페 매출 알려줘" -> "서울시, 강남구"
            ex) "서울대입구역 8번 출구 근처 상권이 궁금해" -> "서울대입구역 8번"
    `,
  });
}

export function toolCallAi(
  message: string,
  categories: BusinessCategoryVectorDto[],
  areaList: AreaVectorDto[],
) {
  const tools = [
    {
      type: 'function',
      name: 'get_store',
      description: '상권 기본 요약 정보를 조회합니다.',
      parameters: {
        type: 'object',
        properties: {
          area_cd: {
            type: 'string',
            description: 'area_cd 값을 이용하여 상권 정보를 가져온다.',
          },
        },
        required: ['area_cd'],
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
          area_cd: {
            type: 'string',
            description: 'area_cd 값을 이용하여 유동인구 정보를 가져온다.',
          },
        },
        required: ['area_cd'],
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
          area_cd: {
            type: 'string',
            description: 'area_cd 값을 이용하여 상주인구 정보를 가져온다.',
          },
        },
        required: ['area_cd'],
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
          area_cd: {
            type: 'string',
            description: 'area_cd 값을 이용하여 직장인구 정보를 가져온다.',
          },
        },
        required: ['area_cd'],
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
          area_cd: {
            type: 'string',
            description: 'area_cd 값을 이용하여 매출 상위 업종을 조회한다.',
          },
        },
        required: ['area_cd'],
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
          area_cd: {
            type: 'string',
            description: 'area_cd 값을 이용하여 점포 상위 업종을 조회한다.',
          },
        },
        required: ['area_cd'],
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
          area_cd: {
            type: 'string',
            description: 'area_cd 값을 이용하여 소득/소비 정보를 가져온다.',
          },
        },
        required: ['area_cd'],
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
          area_cd: {
            type: 'string',
            description: 'area_cd 값을 이용하여 상권 변화지표 정보를 가져온다.',
          },
        },
        required: ['area_cd'],
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
          area_codes: {
            type: 'array',
            items: { type: 'string' },
            description: '비교할 상권의 area_cd 목록입니다.',
          },
        },
        required: ['area_codes'],
        additionalProperties: false,
      },
      strict: true,
    },
  ];
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    temperature: 0,
    input: message,
    tools: tools as Array<Tool>,
    instructions: `
            사용자의 질의에 맞게 도구를 호출해 주세요.
            필요한 경우에만 도구를 호출하고, 도구를 호출하지 않아도 되는 경우에는 호출하지 마세요.
            도구를 호출할 때는 반드시 업종 코드(svc_induty_cd)와 지역 코드(area_cd)를 참고하여 호출해 주세요.

            업종 코드와 이름 같은경우 아래 값을 참고하세요.
            ${formatCategoryVectors(categories)}

            지역 코드와 이름 같은경우 아래 값을 참고하세요.
            ${formatAreaVectors(areaList)}
            `,
  });
}

export function analyzeResults(intput: ResponseInput) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: intput,
    temperature: 0.1,
    instructions: `
            사용자의 질의에 맞게 응답을 생성해 주세요.
            도구 호출 결과를 참고하여 최종 응답을 생성해 주세요.
            `,
  });
}

function formatAreaVectors(areas: AreaVectorDto[]): string {
  return areas
    .map(
      (area) =>
        `area_name: ${area.areaName}, area_level: ${area.areaLevel}, area_code: ${area.areaCode}`,
    )
    .join('\n');
}

function formatCategoryVectors(
  categories: BusinessCategoryVectorDto[],
): string {
  return categories
    .map(
      (cat) =>
        `svc_induty_cd: ${cat.code}, svc_induty_cd_nm: ${cat.categoryName}`,
    )
    .join('\n');
}
