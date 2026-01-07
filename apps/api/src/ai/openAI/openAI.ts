import OpenAI from 'openai';
import { AreaVectorDto, BusinessCategoryVectorDto } from '../dto/column-vector';
import { ResponseInput, Tool } from 'openai/resources/responses/responses.js';
import { TOOLS } from './constant/tools';
import { FINAL_RESPONSE_SCHEMA_FOR_ACTION } from './constant/schemas';
import { RECOMMEND_TABLES } from './constant/tables';
/* DEPRECATED(openAI.service.ts로 대체됨) -> DI 도입 */
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
  input: ResponseInput,
  categories: BusinessCategoryVectorDto[],
  areaList: AreaVectorDto[],
) {
  return OpenAIClient.getClient().responses.create({
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
            ${formatCategoryVectors(categories)}

            지역 코드와 이름 같은경우 아래 값을 참고하세요.
            지도를 이동해야 할 경우(map.pan_to) 반드시 아래 제공된 위도(lat), 경도(lng) 값을 사용하세요.
            ${formatAreaVectors(areaList)}

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

export function analyzeResults(input: ResponseInput) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: input,
    temperature: 0.1,
    text: {
      format: FINAL_RESPONSE_SCHEMA_FOR_ACTION,
    },
    instructions: `
당신은 상권분석 전문가 AI 어시스턴트입니다.
사용자의 질의에 맞게 응답을 생성하고, 적절한 UI 액션을 선택하세요.
도구 호출 결과를 참고하여 최종 응답을 생성해 주세요.

[중요: 액션 선택 우선순위]
- "분석", "매출", "개업률", "폐업률", "얼마 있어", "몇 개" 등 데이터/통계 요청 → ui.open_panel (분석 패널)
- "점포", "가게", "치킨집", "카페", "보여줘" 등 특정 업종 위치/정보 요청 → ui.open_panel
- *주의*: 단순 점포 수나 현황을 물어볼 때도 반드시 'ui.open_panel'을 포함하여 지도에 마커를 보여주세요.
- "순위", "TOP", "랭킹", "높은/낮은 상권" 키워드 → ranking.show (매출 랭킹)
- "비교", "vs", "어디가 나아" 키워드 → compare.areas (상권 비교)
- "유동인구", "방문객", "시간대" 키워드 → population.filter (유동인구)
- "임대료", "수익", "창업비용" 키워드 → rent.calculate (임대료)
- "매물 추천", "빈 상가", "부동산", "보증금", "월세" 키워드 → real_estate.recommend (매물 추천)
- "리포트", "보고서" 키워드 → report.generate (리포트)
- 위 내용 없이 *단순히 위치만* 확인하려는 경우 → map.pan_to (지도 이동)

[사용 가능한 액션 타입]

1. map.pan_to - 지도를 특정 위치로 이동
   - 사용 시점: 업종 분석 없이 *단순 지명 위치*만 궁금해할 때
   - 필수: lat, lng, zoom(항상 3), areaName
   - 예: "강남역 어디야?", "서울 위치 보여줘"

2. ui.open_panel - 분석 패널 열기 (지도가 해당 상권으로 이동함)
   - 사용 시점: 상권 분석, 업종 통계(점포 수, 매출 등), *업종 마커 표시*가 필요할 때
   - 필수: level(gu/dong/commercial), lat, lng, areaName, panelType(summary)
   - 선택: industryCode
   - **중요: industryCode는 사용자가 "치킨", "카페", "음식점" 등 특정 업종을 명시적으로 언급했을 때만 설정하세요.
           업종 언급이 없으면 반드시 industryCode: null로 설정해야 합니다. 임의로 업종 코드를 추측하거나 추가하지 마세요!**
   - 예: "강남역 치킨집 몇 개야?" → industryCode: "CS100007"
   - 예: "서울대입구역 분석해줘" → industryCode: null (업종 언급 없음)

3. ranking.show - 매출 랭킹 표시
   - 사용 시점: 순위, TOP N, 매출 높은/낮은 상권 질문 시
   - 필수: level(gu/dong/commercial)
   - 선택: industryCode (업종 필터)
   - 예: "매출 높은 상권 TOP5 알려줘", "서울에서 제일 잘되는 상권은?" → ranking.show

4. population.filter - 유동인구 필터
   - 사용 시점: 유동인구, 방문객, 시간대별 인구 질문 시
   - 선택: genderFilter(Male/Female/Total), ageFilter, timeFilter
   - 예: "20대 여성이 많이 오는 시간대는?" → population.filter

5. compare.areas - 상권 비교
   - 사용 시점: 두 상권을 비교해달라는 요청 시
   - 필수: compareTargets { codeA, codeB, nameA, nameB }
   - 예: "홍대 vs 이태원 비교해줘" → compare.areas

6. rent.calculate - 임대료 분석
   - 사용 시점: 임대료, 수익성, 창업비용 관련 질문 시
   - 선택: rentParams { area, deposit, rent }
   - 예: "이 상권에서 가게 열면 수익률이 어때?" → rent.calculate

7. report.generate - 리포트 생성
   - 사용 시점: 보고서, 리포트, 요약 문서 요청 시
   - 필수: areaName
   - 예: "강남역 상권 리포트 만들어줘" → report.generate

8. real_estate.recommend - 부동산 매물 추천
   - 사용 시점: 자본금, 보증금, 월세, 면적 조건을 언급하며 매물/상가를 찾을 때
   - **자본금 해석: "자본금 5천만원" = maxDeposit: 5000 (만원 단위)**
   - 필수: areaName, lat, lng + 다음 중 하나 이상:
     - maxDeposit: 최대 보증금 (만원 단위). "자본금", "보증금", "투자금" 언급 시 사용
     - maxMonthlyRent: 최대 월세 (만원 단위)
     - minSize: 최소 면적 (평 단위)
     - keywords: 업종/검색 키워드
   - 예: "자본금 5천만원으로 상가 찾아줘" → maxDeposit: 5000, areaName: 컨텍스트에서
   - 예: "보증금 3천, 월세 200 이하" → maxDeposit: 3000, maxMonthlyRent: 200


[규칙]
- 액션이 필요없는 일반 대화는 빈 배열 []
- 가장 적합한 액션 1개만 선택
- "분석" 키워드가 있으면 map.pan_to 대신 ui.open_panel 사용!
- map.pan_to 사용 시, 반드시 도구 호출 결과나 컨텍스트에 포함된 lat, lng 값을 사용하세요. 임의의 값을 생성하지 마세요.
- 사용하지 않는 payload 필드는 null로 설정

[특별 규칙: 서울대입구역 유사 상권 질의]
- 트리거: 사용자가 "서울대입구"와 "비슷한" (또는 "유사한", "닮은")이라는 단어를 함께 사용하여 질문할 경우
- 답변: 무조건 **"홍대입구역"**을 추천하세요. "서울대입구역과 홍대입구역은 대학가 상권으로서 20대 유동인구가 풍부하고, 트렌디한 F&B가 밀집해 있다는 점이 매우 비슷해요! 홍대입구역 상권을 분석해 드릴게요."라고 설명하세요.
- 액션: 'compare.areas' (비교) 액션을 절대 사용하지 마세요. 대신 **'ui.open_panel' (상권 분석)** 액션을 사용하여 홍대입구역을 보여주세요.
- Payload: target areaName="홍대입구역" (필요시 lat: 37.5567, lng: 126.9237 사용)
`,
  });
}

export function getTablesByMessage(message: string) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    temperature: 0,
    input: message,
    instructions: `
            #context
            당신은 상권분석 전문가 입니다.
            사용자의 질의에 어울리는 지역(area_cd)을 추천해주기 위해
            어울리는 테이블 세개를 아래에서 골라 주세요.
            ','로 구분하여 나열해 주세요. 
            지역을 추천할 수 없는 질의인 경우 빈문자열을 반환해 주세요.
    
            #예시
            ex) "한식이 잘나가는 상권 알려줘" -> v_sales, v_foot_traffic, v_commercial_change
            ex) "카페 매출이 높은 지역 추천해줘" -> v_sales, v_income_consumption, v_foot_traffic
            ex) "아무말" -> ""

            사용 가능한 테이블은 아래와 같습니다.
            v_commercial_change: 상권변화지표
            v_foot_traffic: 유동인구
            v_income_consumption: 소득소비지표
            v_resident_population: 상주인구
            v_sales: 매출
            v_working_population: 직장인구
            `,
  });
}

export function getRecommendCommercialAreasQuery(
  message: string,
  categories: BusinessCategoryVectorDto[],
  areaList: AreaVectorDto[],
  tables: string[],
) {
  return OpenAIClient.getClient().responses.create({
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
            ${formatCategoryVectors(categories)}

            지역 코드와 이름 같은경우 아래 값을 참고하세요.
            ${formatAreaVectors(areaList)}

            데이터 베이스 정보는 아래와 같습니다.
            ${formatTableList(tables)}

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

function formatAreaVectors(areas: AreaVectorDto[]): string {
  return areas
    .map(
      (area) =>
        `area_name: ${area.areaName}, area_level: ${area.areaLevel}, area_code: ${area.areaCode}, lat: ${area.lat || 'null'}, lng: ${area.lng || 'null'}`,
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

function formatTableList(tables: string[]): string {
  let result = '';
  for (const table of tables) {
    if (RECOMMEND_TABLES[table]) {
      result += `${table}: ${RECOMMEND_TABLES[table]}\n`;
    }
  }
  return result;
}

export function getAiAnalysis(
  topic: string,
  areaName: string,
  metrics: string,
) {
  const instructionsByTopic: Record<string, string> = {
    population: `당신은 유동인구 분석 전문가입니다. 24시간 시간대별 유동인구 데이터를 바탕으로 해당 상권의 '인구 유동 특성'을 3줄 이내로 분석해 주세요.`,
    revenue: `당신은 매출 분석 전문가입니다. 해당 상권의 '매출 수익 구조'를 바탕으로 수익성과 성장 잠재력을 3줄 이내로 요약해 주세요.`,
    industry: `당신은 업종 분석 전문가입니다. 상권 내 '업종 분석' 결과와 경쟁 환경을 바탕으로 창업 시 고려할 핵심 포인트를 3줄 이내로 진단해 주세요.`,
  };

  const defaultInstruction = `당신은 상권분석 전문가입니다. 주어진 데이터를 바탕으로 핵심 특징을 3줄 이내로 명확하게 요약해 주세요.`;

  return OpenAIClient.getClient().responses.create({
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

export function getRealEstateSummary(metrics: string) {
  return OpenAIClient.getClient().responses.create({
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
