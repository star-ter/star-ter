import OpenAI from 'openai';
import {
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

export function chatToVectorSearchWords(message: string) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: message,
    temperature: 0,
    instructions: `
            사용자가 질의를 하면 상권분석 벡터 탐색에 유리하도록 평문으로 파싱해주세요
            소득소비, 점포, 아파트, 집객시설, 추정매출, 유동인구, 상주인구, 직장인구, 상권변화지표 데이터가있습니다.
            지역 수준은 서울시, 자치구, 행정동, 상권이 있습니다. 특별한 말이 없을 경우 상권 수준으로 파싱해주세요
            지역 명 같은 경우 제거해 주세요
            ex) "홍대에서 잘나가는 업종 알려줘" -> "상권 단위 업종별 총 매출 금액"
    `,
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

export function nlToSql(
  message: string,
  formatted_results: ColumnVectorDto[],
  categories: BusinessCategoryVectorDto[],
) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: message,
    temperature: 0,
    instructions: `
            Output only the SQL query.
            Do not include explanations, comments, markdown, or code fences.
            Return plain SQL text only.

            주어진 질의에 대해 postgreSQL 문을 짜주세요.
            데이터 해석이 쉽도록 적절한 alias를 사용해 주세요.
            시점에 따른 말이 없을 경우 기본적으로 stdr_yyqu_cd = '20253' 조건을 넣어주세요
            limit은 최대 3건으로 해주세요
            
            아래 데이터베이스 테이블과 컬럼을 참고하세요. 테이블과 컬럼 매칭을 잘 해주세요.
            ${formatColumnVectors(formatted_results)}

            업종 코드와 이름 같은경우 아래 값을 참고하세요
            ${formatCategoryVectors(categories)}

            사용자가 원하는 정보가 업종 관련된 내용일 경우 반드시 업종코드(svc_induty_cd) 조건을 포함시켜 주세요
            `,
  });
}

export function analyzeSqlResults(message: string, results: any[]) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-nano',
    input: message,
    temperature: 0.3,
    instructions: `
            아래 주어진 SQL 조회 결과 데이터를 분석하여 사용자 질의에 맞게 설명해 주세요.
            중요한 수치나 트렌드가 있다면 강조해 주세요.
            사용자에게 SQL문이나 코드와 같은 데이터를 말하지 마세요.
            ${JSON.stringify(results, safeBigIntStringify)}
            `,
  });
}

function formatColumnVectors(columns: ColumnVectorDto[]): string {
  return columns
    .map(
      (col) =>
        `table: ${col.tableName}, column: ${col.columnName}, dataType: ${col.dataType}, description: ${col.text}`,
    )
    .join('\n');
}

function formatCategoryVectors(
  categories: BusinessCategoryVectorDto[],
): string {
  return categories
    .map(
      (cat) =>
        `svc_induty_cd: ${cat.code}, svc_induty_cd_nm: ${cat.category_name}`,
    )
    .join('\n');
}

function safeBigIntStringify(key: string, value: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return typeof value === 'bigint' ? value.toString() : value;
}
