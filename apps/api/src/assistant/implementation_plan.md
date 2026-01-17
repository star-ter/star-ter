# SourceCard 기능 구현 계획

AI 응답에 사용된 데이터 출처를 표시하는 SourceCard 기능 구현

---

## 목표

- Tool 호출 시 어떤 데이터 소스가 사용됐는지 추적
- 프론트엔드에서 SourceCard로 표시

---

## Phase 1: Tool 메타데이터 정의

### [NEW] `src/ai/tools/tool-metadata.ts`

```typescript
export interface ToolMetadata {
  displayName: string;
  source: string;
  icon?: string;
}

export const TOOL_METADATA: Record<string, ToolMetadata> = {
  get_store: { displayName: "상권 기본정보", source: "서울시 상권분석 시스템" },
  estimate_revenue_and_cost: {
    displayName: "매출 추정",
    source: "서울시 빅데이터 캠퍼스",
  },
  predict_survival_rate: {
    displayName: "생존율 예측",
    source: "소상공인진흥공단 통계",
  },
  recommend_real_estate: { displayName: "매물 추천", source: "네이버 부동산" },
  // ... 21개 Tool 전체 정의
};
```

---

## Phase 2: 백엔드 수정

### [MODIFY] `src/ai/ai.service.ts`

1. Tool 호출 시 이름 수집
2. 응답에 sources 배열 추가

```typescript
// Line 62 근처: usedTools 배열 추가
const usedTools: string[] = [];

for (const toolCall of toolCallResponse.output) {
  if (toolCall.type !== "function_call") continue;
  usedTools.push(toolCall.name); // ← 수집
  // ...
}

// Line 134 근처: parsedResponse에 sources 추가
parsedResponse.sources = usedTools.map((name) => ({
  tool: name,
  ...TOOL_METADATA[name],
}));
```

### [MODIFY] `src/assistant/assistant.service.ts`

Claude도 동일하게 sources 수집 및 추가

---

## Phase 3: 프론트엔드 수정

### [NEW] `components/chat/SourceCard.tsx`

```tsx
export function SourceCard({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null;
  return (
    <div className="bg-slate-50 rounded-lg p-3 mt-3 border">
      <h4 className="text-sm font-semibold text-slate-600 mb-2">
        📊 이 답변에 사용된 데이터
      </h4>
      <ul className="space-y-1">
        {sources.map((s) => (
          <li key={s.tool} className="text-xs text-slate-500">
            • {s.displayName} ({s.source})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### [MODIFY] `components/chat/ChatMessage.tsx`

AI 메시지 아래에 SourceCard 렌더링

### [MODIFY] `lib/api/ai.ts`

`AiChatResponse` 타입에 `sources` 필드 추가

---

## 수정 파일 목록

| 파일                     | 작업                        |
| ------------------------ | --------------------------- |
| `tools/tool-metadata.ts` | [NEW] 21개 Tool 메타데이터  |
| `ai.service.ts`          | [MODIFY] sources 수집       |
| `assistant.service.ts`   | [MODIFY] Claude용 동일 적용 |
| `SourceCard.tsx`         | [NEW] UI 컴포넌트           |
| `ChatMessage.tsx`        | [MODIFY] SourceCard 렌더링  |
| `lib/api/ai.ts`          | [MODIFY] 타입 추가          |

---

## 검증 계획

1. OpenAI로 "강남역 치킨집 매출 분석" 질문
2. 응답에 sources 배열 포함 확인
3. SourceCard UI 렌더링 확인
4. Claude로 동일 테스트
