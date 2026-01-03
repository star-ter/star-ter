import OpenAI from 'openai';
import {
  AreaVectorDto,
  BusinessCategoryVectorDto,
  ColumnVectorDto,
} from '../dto/column-vector';

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

export function nlToSql(
  message: string,
  similarColumns: ColumnVectorDto[],
  categories: BusinessCategoryVectorDto[],
  areaList: AreaVectorDto[],
) {
  console.log(formatAreaVectors(areaList));
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: message,
    instructions: `
            당신은 postgreSQL 전문가입니다.
            Output only the SQL query.
            Do not include explanations, comments, markdown, or code fences.
            Return plain SQL text only.

            주어진 질의에 대해 답변을 해줄 수 있는 적절한  postgreSQL 문을 짜주세요.
            데이터 해석이 쉽도록 적절한 alias를 사용해 주세요.
            컬럼과 테이블 매핑을 필수로 해주세요
            시점에 따른 말이 없을 경우 기본적으로 stdr_yyqu_cd = '20253' 조건을 넣어주세요
            
            아래 데이터베이스 테이블과 컬럼을 참고하세요. 필요한 컬럼만 10개를 선택하여 사용하면 됩니다.
            ${formatColumnVectors(similarColumns)}

            업종 코드와 이름 같은경우 아래 값을 참고하세요.
            ${formatCategoryVectors(categories)}
            사용자가 원하는 정보가 업종 관련된 내용일 경우 반드시 업종코드(svc_induty_cd) 조건을 포함시키고 풀력에 업종 명을 넣어주세요

            지역 코드와 이름 같은경우 아래 값을 참고하세요.
            area_cd를 이용하여 조건을 걸어주세요.
            ${formatAreaVectors(areaList)}
            `,
  });
}

export function analyzeSqlResults(message: string, results: any[]) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: message,
    temperature: 0.3,
    instructions: `
            아래 주어진 SQL 조회 결과 데이터를 이용하여 사용자 질의에 답변해 주세요.
            수치와 조회 결과 중심으로 설명해주세요.
            사용자는 SQL 결과를 알지 못합니다. 설명을 할 때 상권 명, 수치 등을 구체적으로 언급해 주세요.
            사용자에게 SQL문이나 코드와 같은 데이터를 말하지 마세요.
            ${JSON.stringify(results, safeBigIntStringify)}
            `,
  });
}

function formatColumnVectors(columns: ColumnVectorDto[]): string {
  return columns
    .map(
      (col) =>
        `table: ${col.tableName}, column: ${col.columnName}, dataType: ${col.dataType}, description: ${col.description}`,
    )
    .join('\n');
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

function safeBigIntStringify(key: string, value: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return typeof value === 'bigint' ? value.toString() : value;
}
