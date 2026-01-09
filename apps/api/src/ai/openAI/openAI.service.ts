import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ResponseInput, Tool } from 'openai/resources/responses/responses.js';
import { AreaVectorDto, BusinessCategoryVectorDto } from '../dto/column-vector';
import { TOOLS } from './constant/tools';
import { FINAL_RESPONSE_SCHEMA_FOR_ACTION } from './constant/schemas';
import { RECOMMEND_TABLES } from './constant/tables';
import {
  PROMPT_ANALYZE_RESULTS,
  PROMPT_CATEGORY_ANALYSIS,
  PROMPT_LOCATION_ANALYSIS,
  PROMPT_TABLE_SELECTION,
} from './constant/prompts';

@Injectable()
export class OpenAiService {
  private readonly client: OpenAI;
  private readonly logger = new Logger(OpenAiService.name);

  constructor() {
    this.client = new OpenAI();
  }

  getText(response: OpenAI.Responses.Response) {
    return response?.output_text || '';
  }

  async embedText(text: string) {
    return this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
  }

  async getCategoryByMessage(message: string) {
    return this.client.responses.create({
      model: 'gpt-4.1-mini',
      input: message,
      temperature: 0,
      instructions: PROMPT_CATEGORY_ANALYSIS,
    });
  }

  async getLocationByMessage(message: string) {
    return this.client.responses.create({
      model: 'gpt-4.1-mini',
      input: message,
      temperature: 0,
      instructions: PROMPT_LOCATION_ANALYSIS,
    });
  }

  async toolCallAi(
    input: ResponseInput,
    categories: BusinessCategoryVectorDto[],
    areaList: AreaVectorDto[],
  ) {
    return this.client.responses.create({
      model: 'gpt-4.1-mini',
      temperature: 0,
      input: input,
      tools: TOOLS as Array<Tool>,
      instructions: `
              당신은 상권분석 전문가 입니다.
              사용자의 질의에 맞게 도구를 호출해 주세요.
              필요한 경우에만 도구를 호출하고, 도구를 호출하지 않아도 되는 경우에는 호출하지 마세요.
              도구를 호출할 때는 반드시 업종 코드(svc_induty_cd)와 지역 코드(area_cd)를 참고하여 호출해 주세요.
  
              업종 코드와 이름 같은경우 아래 값을 참고하세요.
              ${this.formatCategoryVectors(categories)}
  
              지역 코드와 이름 같은경우 아래 값을 참고하세요.
              지도를 이동해야 할 경우(map.pan_to) 반드시 아래 제공된 위도(lat), 경도(lng) 값을 사용하세요.
              ${this.formatAreaVectors(areaList)}
  
              [중요]
              업종 코드는 반드시 위에서 제공된 목록(svc_induty_cd) 중 하나를 사용해야 합니다.
              'Q12', 'I2' 같은 상위 분류 코드나 존재하지 않는 코드를 절대 사용하지 마세요.
              목록에 적합한 코드가 없다면 null을 사용하세요.
  
              [업종 관련 질의 시 도구 선택 - 매우 중요]
              사용자가 "치킨", "카페", "음식점" 등 특정 업종을 언급하면, 반드시 'get_industry_commercial_summary' 도구를 사용하세요.
              - 예: "서울대입구역에서 치킨집 창업 어때?" → get_industry_commercial_summary (areaCd + categoryCode)
              - 예: "강남역 카페 매출 알려줘" → get_industry_commercial_summary (areaCd + categoryCode)
              
              'get_store' 도구는 업종 구분 없이 상권 전체 요약이 필요할 때만 사용하세요.
              업종이 명시되면 get_store가 아닌 get_industry_commercial_summary를 호출해야 합니다!
  
              [부동산 매물 추천 시 주의사항 - 최우선 순위]
              사용자가 "추천"과 함께 가격(보증금, 월세)이나 면적 조건을 언급하면, **무조건** 'recommend_real_estate' 도구를 호출해야 합니다.
              업종 코드 유무와 상관없이 이 도구를 호출하세요.
              다른 도구(UI 패널 등)보다 이 도구 호출이 우선입니다.
              `,
    });
  }

  async analyzeResults(input: ResponseInput) {
    return this.client.responses.create({
      model: 'gpt-4.1-mini',
      input: input,
      temperature: 0.1,
      text: {
        format: FINAL_RESPONSE_SCHEMA_FOR_ACTION,
      },
      instructions: PROMPT_ANALYZE_RESULTS,
    });
  }

  /**
   * 스트리밍 방식으로 최종 분석 결과를 생성합니다.
   * `stream: true` 옵션을 사용하여 AsyncIterable을 반환합니다.
   * 각 이벤트는 OpenAI의 SSE 형식으로 전달됩니다.
   */
  async analyzeResultsStream(input: ResponseInput) {
    return this.client.responses.create({
      model: 'gpt-5.2',
      input: input,
      //temperature: 0.1,
      reasoning: {
        effort: 'none',
      },
      stream: true, // 스트리밍 활성화
      text: {
        format: FINAL_RESPONSE_SCHEMA_FOR_ACTION,
      },
      instructions: PROMPT_ANALYZE_RESULTS,
    });
  }

  async getTablesByMessage(message: string) {
    return this.client.responses.create({
      model: 'gpt-4.1-mini',
      temperature: 0,
      input: message,
      instructions: PROMPT_TABLE_SELECTION,
    });
  }

  async getRecommendCommercialAreasQuery(
    message: string,
    categories: BusinessCategoryVectorDto[],
    areaList: AreaVectorDto[],
    tables: string[],
  ) {
    return this.client.responses.create({
      model: 'gpt-4.1-mini',
      temperature: 0,
      input: message,
      instructions: `
              #context
              사용자의 질의에 어울리는 지역(area_cd)을 3개 이하로 추천해주는 PostgreSQL 쿼리를 작성해주세요.
              매출이 높은곳, 해당 업종에 어울리는 유동인구가 많은 곳, 해당 업종에 어울리는 상주인구가 많은곳 등
              다양하고 간단한 관점에서 각 하나씩 뽑아 중복되지 않는 총 세개 이하를 추천해주세요.
              별칭으로 해당 지역이 어떤 관점에서 추천되었는지 추천 사유와 추천 사유에 맞는 재치있는 설명을 함께 반환해주세요.
    
              ex) '해당 업종 매출 상위 지역', '남성 유동인구 상위 지역', '청년 상주인구 상위 지역', '여성 직장인구 상위 지역', '폐업률 낮은 지역' 등
              
              #쿼리문 작성
              지역레벨(시/자치구/행정동/상권)에 대한 언급이 없을 경우 area_level는 commercial로 해주세요
              시점에 대한 얘기가 없을 경우 stdr_yyqu_cd는 20253으로 해주세요.
              area_cd를 select할때 테이블.area_cd 형식으로 작성해주세요.
              
              출력문에는 SQL 쿼리문만 작성해주세요. 부가 설명이나 다른 텍스트는 포함하지 마세요.
              sql을 구분짓기 위한 표기도 하지마세요 오직 쿼리문만 출력하세요.
  
              #참고자료
              업종 코드와 이름 같은경우 아래 값을 참고하세요.
              ${this.formatCategoryVectors(categories)}
  
              지역 코드와 이름 같은경우 아래 값을 참고하세요.
              ${this.formatAreaVectors(areaList)}
  
              데이터 베이스 정보는 아래와 같습니다.
              ${this.formatTableList(tables)}
  
              #최종 출력 예시
              with sales_rank as (select area_cd,
                                    area_nm,
                                    area_level,
                                    thsmon_selng_amt
                            from v_sales
                            where svc_induty_cd = 'CS100008'
                              and stdr_yyqu_cd = '20253'
                              and area_level = 'commercial'
                            order by thsmon_selng_amt desc
                            limit 1),
              foot_traffic_rank as (select area_cd,
                                          area_nm,
                                          area_level,
                                          tot_flpop_co
                                    from v_foot_traffic
                                    where stdr_yyqu_cd = '20253'
                                      and area_level = 'commercial'
                                    order by tot_flpop_co desc),
              residential_population as (select area_cd,
                                                area_nm,
                                                area_level,
                                                agrde_20_flpop_co + agrde_30_flpop_co as young_population
                                        from v_foot_traffic
                                        where stdr_yyqu_cd = '20253'
                                          and area_level = 'commercial'
                                        order by young_population desc
                                        limit 1)
              select area_cd, area_level, area_nm, '해당 업종 매출 상위 지역' as recommend_title, '분식집이 잘나가는 곳!' as recommend_reason
              from sales_rank
              union all
              select area_cd, area_level, area_nm, '유동인구 상위 지역' as recommend_title, '사람들이 많이 모이는 활기찬 상권!' as recommend_reason
              from foot_traffic_rank
              union all
              select area_cd, area_level, area_nm, '청년 유동인구 상위 지역' as recommend_title, '젊은이들이 즐겨 찾는 핫플레이스!' as recommend_reason
              from residential_population
              `,
    });
  }

  async getAiAnalysis(topic: string, areaName: string, metrics: string) {
    const instructionsByTopic: Record<string, string> = {
      population: `당신은 유동인구 분석 전문가입니다. 24시간 시간대별 유동인구 데이터를 바탕으로 해당 상권의 '인구 유동 특성'을 3줄 이내로 분석해 주세요.`,
      revenue: `당신은 매출 분석 전문가입니다. 해당 상권의 '매출 수익 구조'를 바탕으로 수익성과 성장 잠재력을 3줄 이내로 요약해 주세요.`,
      industry: `당신은 업종 분석 전문가입니다. 상권 내 '업종 분석' 결과와 경쟁 환경을 바탕으로 창업 시 고려할 핵심 포인트를 3줄 이내로 진단해 주세요.`,
    };

    const defaultInstruction = `당신은 상권분석 전문가입니다. 주어진 데이터를 바탕으로 핵심 특징을 3줄 이내로 명확하게 요약해 주세요.`;

    return this.client.responses.create({
      model: 'gpt-5-nano',
      reasoning: {
        effort: 'minimal',
      },
      input: `[주제: ${topic}]\n지역: ${areaName}\n데이터:\n${metrics}`,
      instructions: `
              ${instructionsByTopic[topic] || defaultInstruction}
              사용자가 한눈에 핵심을 파악할 수 있도록 말투는 "~해요" 체로 친근하지만 전문적으로 작성해 주세요.
              없는 정보는 언급하지 말고, 핵심만 짚어서 전달하세요.
              `,
    });
  }

  async getRealEstateSummary(metrics: string) {
    return this.client.responses.create({
      model: 'gpt-5-nano',
      reasoning: {
        effort: 'minimal',
      },
      input: metrics,
      instructions: `
              당신은 부동산 전문가입니다.
              주어진 매물 데이터(보증금, 월세, 권리금, 면적, 층수 등)를 분석하여 이 지역의 부동산 현황을 3줄 이내로 요약해주세요.
  
              요약에는 다음 내용을 포함해주세요:
              - 평균 보증금, 월세, 권리금 수준
              - 주요 면적대 (소형/중형/대형)
              - 창업자에게 도움이 될 인사이트
  
              전문 용어는 쉽게 풀어서 설명하고, 없는 정보는 언급하지 마세요.
              말투는 "~해요" 체로 친근하지만 전문적으로 작성해주세요.
  
              중요: "요약합니다", "3줄 요약", "분석 결과입니다" 같은 도입 멘트 없이 바로 본문 내용으로 시작하세요.
              각 줄은 "- " 로 시작하는 bullet point 형식으로 작성해주세요.
              `,
    });
  }

  private formatAreaVectors(areas: AreaVectorDto[]): string {
    return areas
      .map(
        (area) =>
          `area_name: ${area.areaName}, area_level: ${area.areaLevel}, area_code: ${area.areaCode}, lat: ${area.lat || 'null'}, lng: ${area.lng || 'null'}`,
      )
      .join('\n');
  }

  private formatCategoryVectors(
    categories: BusinessCategoryVectorDto[],
  ): string {
    return categories
      .map(
        (cat) =>
          `svc_induty_cd: ${cat.code}, svc_induty_cd_nm: ${cat.categoryName}`,
      )
      .join('\n');
  }

  private formatTableList(tables: string[]): string {
    let result = '';
    for (const table of tables) {
      if (RECOMMEND_TABLES[table]) {
        result += `${table}: ${RECOMMEND_TABLES[table]}\n`;
      }
    }
    return result;
  }
}
