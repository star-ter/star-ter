import OpenAI from 'openai';
import { ColumnVectorDto } from '../dto/column-vector';

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

export function nlToSql(message: string, formatted_results: ColumnVectorDto[]) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: message,
    temperature: 0,
    instructions: `
            Output only the SQL query.
            Do not include explanations, comments, markdown, or code fences.
            Return plain SQL text only.

            주어진 질의에 대해 postgreSQL 문을 짜주세요.
            아래 데이터베이스 테이블과 컬럼을 참고하세요
            시점에 따른 말이 없을 경우 기본적으로 stdr_yyqu_cd = '20253' 조건을 넣어주세요
            ${formatColumnVectors(formatted_results)}
            `,
  });
}

export function analyzeSqlResults(results: any[]) {
  return OpenAIClient.getClient().responses.create({
    model: 'gpt-4.1-mini',
    input: JSON.stringify(results, safeBigIntStringify),
    temperature: 0.5,
    instructions: `
            주어진 SQL 조회 결과 데이터를 분석하여 사용자가 이해하기 쉽게 요약해 주세요.
            중요한 수치나 트렌드가 있다면 강조해 주세요.
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

function safeBigIntStringify(key: string, value: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return typeof value === 'bigint' ? value.toString() : value;
}
