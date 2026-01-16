// =========================================
// AI 응답 타입 정의
// Backend response-schemas.ts와 동기화 필요
// =========================================

export interface AiAction {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

// Artifact 데이터 포인트
export interface ArtifactDataPoint {
  label: string;
  value: number;
}

// Artifact 스펙 (차트/테이블/게이지 공통)
export interface ArtifactSpec {
  // chart 전용
  chartType?: 'line' | 'bar' | 'pie' | 'radar' | 'waterfall' | null;
  data?: ArtifactDataPoint[];
  // gauge 전용
  current?: number | null;
  max?: number | null;
  threshold?: number | null;
  // table 전용
  columns?: string[] | null;
  rows?: (string | number | null)[][] | null;
}

// Artifact (LLM이 생성하는 시각화 데이터)
export interface Artifact {
  id: string;
  kind: 'chart' | 'table' | 'gauge' | 'checklist' | 'comparison_card';
  title: string;
  spec: ArtifactSpec;
}

// AI 응답
export interface AiResponse {
  reply: string;
  actions?: AiAction[];
  artifacts?: Artifact[];
  suggestedPrompts?: string[];
}

export interface AiChatResponse extends AiResponse {
  conversationId?: string;
}

// 타입 정의만 남기고 API 호출 함수 제거
// Server Actions (app/actions/chat.ts) 사용으로 전환됨
