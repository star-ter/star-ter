# plan.md — AI Chat + Map Interaction + Visual Responses

## 목표

상권 분석 서비스에서 LLM 챗이 단순 텍스트 답변을 넘어서:

- 지도에서 레이어/하이라이트/마커 등 **인터랙션을 트리거**하고
- 유동인구/리스크/손익분기 등 **차트·테이블 같은 시각적 아티팩트**를 함께 제공한다.

### 핵심 원칙

- **LLM**: Tool 결과를 보고 **reply + actions + artifacts** 모두 생성 (Structured Output)
- **백엔드**: Tool(API) 실행 → 정량 데이터 확보 → 좌표 패치만
- **프론트**: Actions 실행 + Artifacts 렌더링

---

## 아키텍처 개요

### OpenAI 기능 사용 구분

| 기능                  | 용도                                                   | 시점         |
| --------------------- | ------------------------------------------------------ | ------------ |
| **Function Calling**  | LLM이 백엔드 API(Tool)를 호출하여 **수치 데이터 획득** | 응답 생성 전 |
| **Structured Output** | LLM이 프론트에 **명령(actions) + 텍스트(reply)** 전달  | 응답 생성 시 |

### 전체 흐름

```
1. User message 수신

2. [Vector DB 컨텍스트 추출] ← 핵심!
   Backend: 메시지에서 지역명/업종명 추출 (LLM)
   Backend: 임베딩 생성 → Vector DB 검색
   → categories: [{ code: "CS100007", categoryName: "치킨전문점" }]
   → areaList: [{ areaCode: "3110057", areaName: "서울대입구역", lat, lng }]

3. [Function Calling 단계]
   LLM: 프롬프트에 categories/areaList 주입받음
   LLM: "유동인구 데이터 필요해" → get_foot_traffic(areaId) 호출
   Backend: Tool 실행 → raw data 반환

4. [Structured Output 단계]
   LLM: Tool 결과를 보고 최종 응답 생성
   → { reply, actions, artifacts, suggestedPrompts }
   (JSON Schema로 포맷 강제, LLM이 모든 필드 생성)

5. [Backend 후처리]
   Backend: 좌표 패치만 (LLM이 생성한 좌표가 부정확할 수 있으므로)

6. [Frontend 렌더링]
   Front: actions 실행 + artifacts 렌더링
```

### Vector DB 구조 (현재 구현)

| 테이블                           | 용도              | 검색 쿼리              |
| -------------------------------- | ----------------- | ---------------------- |
| `business_category_vector_table` | 업종명 → 업종코드 | `embedding <=> vector` |
| `area_vector_table`              | 지역명 → 지역코드 | `embedding <=> vector` |

```typescript
// ai.service.ts
async getCategories(message: string) {
  // 1. LLM으로 업종명 추출 ("치킨집 창업" → "치킨")
  const categoryText = await this.openAiService.getCategoryByMessage(message);

  // 2. 임베딩 생성 (text-embedding-3-small)
  const categoryVector = await this.openAiService.embedText(category);

  // 3. Vector DB에서 가장 유사한 업종코드 검색 (pgvector)
  const results = await this.aiRepository.categorySearchByVector(vector, 3);
  // → [{ code: "CS100007", categoryName: "치킨전문점" }]
}

async getAreaInfo(message: string) {
  // 동일한 흐름으로 지역코드 + 좌표 추출
  // → { areaCode: "3110057", areaName: "서울대입구역", lat: 37.5, lng: 127.0 }
}
```

### 코드 흐름 (현재 구현)

```typescript
// ai.service.ts - getAIMessageWithHistory()

// 1. 컨텍스트 준비 (업종/지역 추출)
const [categories, areaList] = await Promise.all([
  this.getCategories(message),
  this.getAreaInfo(message),
]);

// 2. 대화 히스토리 + 현재 메시지로 input 구성
const input: ResponseInputItem[] = [
  ...history,
  { role: 'user', content: message },
];

// 3. Function Calling - LLM이 필요한 Tool 선택
const toolCallResponse = await this.openAiService.toolCallAi(
  input,
  categories,
  areaList,
);
input.push(...toolCallResponse.output);

// 4. Tool 실행 (루프)
for (const toolCall of toolCallResponse.output) {
  if (toolCall.type !== 'function_call') continue;
  const toolResult = await this.aiToolsService.run(
    toolCall.name,
    toolCall.arguments,
  );
  input.push({
    type: 'function_call_output',
    call_id: toolCall.call_id,
    output: JSON.stringify(toolResult),
  });
}

// 5. Structured Output - LLM이 최종 응답 생성
const analyzeResult = await this.openAiService.analyzeResults(input);
const responseText = this.openAiService.getText(analyzeResult);
// → { reply: "...", actions: [...] }

// 6. 좌표 패치 (LLM이 생성한 좌표가 부정확할 수 있으므로)
const parsedResponse = this.aiResponseProcessor.parseResponse(responseText);
const finalJson = this.aiResponseProcessor.patchCoordinates(
  parsedResponse,
  areaList,
);

return finalJson;
```

### 현재 미구현 (추가 예정)

```typescript
// TODO: Phase 1에서 구현 예정
// 7. Backend에서 artifacts 구성
// const artifacts = buildArtifacts(toolResults, finalResponse.actions);

// 8. suggestedPrompts 추가
// return { ...finalResponse, artifacts, suggestedPrompts };
```

---

## 응답 포맷

### 현재 구현 (Backend → Front)

```json
{
  "reply": "서울대입구역은 유동인구 약 12만명으로, 최근 12주간 8% 상승했어요.",
  "actions": [
    { "type": "ui.open_panel", "payload": { "areaName": "서울대입구역", "lat": 37.5, "lng": 127.0, ... } }
  ]
}
```

### 목표 포맷 (Phase 1 이후)

```json
{
  "reply": "서울대입구역은 유동인구 약 12만명으로, 최근 12주간 8% 상승했어요.",
  "actions": [
    { "type": "ui.open_panel", "payload": { "areaName": "서울대입구역", ... } },
    { "type": "map.setLayer", "payload": { "layer": "footTraffic", "visible": true } }
  ],
  "artifacts": [
    {
      "id": "a1",
      "kind": "chart",
      "spec": { "chartType": "line", "title": "유동인구 추이", "data": [...] }
    }
  ],
  "suggestedPrompts": ["시간대별로 보여줘", "경쟁 밀도는?"]
}
```

### 설계 원칙

- `reply`: LLM이 생성. Tool 결과 숫자 인용 가능
- `actions`: LLM이 생성. 프론트가 즉시 실행
- `artifacts`: **LLM이 생성** (Structured Output으로 강제)
- `suggestedPrompts`: LLM이 생성. 다음 질문 칩

> ⚠️ **LLM이 숫자 배열을 정확히 복사하지 못할 수 있음**
> 긴 시계열 데이터보다는 요약 차트(top 5, 최근 4주 등)만 artifacts에 포함 권장

---

## Action 타입 (현재 프로젝트 기준)

### 기존 Actions (유지)

| Action                  | 설명                                           |
| ----------------------- | ---------------------------------------------- |
| `map.pan_to`            | 지도 이동 (lat, lng, zoom)                     |
| `ui.open_panel`         | 분석 패널 열기 (areaName, level, industryCode) |
| `map.highlight`         | 폴리곤 하이라이트                              |
| `ranking.show`          | 매출 랭킹 표시                                 |
| `population.filter`     | 유동인구 필터                                  |
| `compare.areas`         | 상권 비교                                      |
| `rent.calculate`        | 임대료 분석                                    |
| `report.generate`       | 리포트 생성                                    |
| `real_estate.recommend` | 매물 추천                                      |

### 신규 Actions (추가 예정)

| Action             | 설명                          | 구현 노트            |
| ------------------ | ----------------------------- | -------------------- |
| `map.setLayer`     | 레이어 토글 (히트맵, 마커)    | MapSection 로직 포팅 |
| `map.setMarkers`   | 마커 표시 (경쟁점포, 매물)    | MapSection 로직 포팅 |
| `ui.showChart`     | 차트 렌더링 (artifactId 참조) | 신규                 |
| `ui.showTable`     | 테이블 렌더링                 | 신규                 |
| `state.setContext` | 컨텍스트 업데이트             | 신규                 |

---

## Tool(API) 목록 (현재 프로젝트 기준)

### 기존 Tools (유지)

| Tool                               | 설명             |
| ---------------------------------- | ---------------- |
| `get_store`                        | 상권 기본 요약   |
| `get_foot_traffic`                 | 유동인구 요약    |
| `get_resident_population`          | 상주인구         |
| `get_working_population`           | 직장인구         |
| `get_sales_top_industries`         | 매출 상위 업종   |
| `get_store_top_industries`         | 점포 상위 업종   |
| `get_income_consumption`           | 소득/소비        |
| `get_commercial_change`            | 상권 변화지표    |
| `compare_commercial_areas`         | 상권 비교        |
| `get_industry_commercial_summary`  | 업종별 상권 요약 |
| `recommend_commercial_by_industry` | 업종별 상권 추천 |
| `compare_commercial_by_industry`   | 업종별 비교      |
| `recommend_real_estate`            | 매물 추천        |

### 신규 Tools (추가 예정)

| Tool                          | 설명            | 구현 노트                    |
| ----------------------------- | --------------- | ---------------------------- |
| `get_foot_traffic_timeseries` | 유동인구 시계열 | 차트용 data + summary        |
| `get_foot_traffic_by_hour`    | 시간대별 분포   | 24h 바차트                   |
| `get_foot_traffic_by_dow`     | 요일별 패턴     | 요일 바차트                  |
| `get_competitor_density`      | 경쟁 밀도       | 반경 내 경쟁점 수            |
| `get_open_close_rate`         | 개폐업률        | 리스크 지표                  |
| `calc_break_even`             | 손익분기 계산   | 임대료 DB + 업종 평균 고정비 |
| `estimate_sales`              | 매출 추정       | 업종/상권 기반               |

### Tool 응답 규격 (필수)

모든 Tool 응답은 아래 구조를 따름:

```json
{
  "data": { ... },           // 차트/테이블용 정량 데이터
  "summary": "한 줄 요약",    // LLM이 인용할 텍스트
  "meta": { "unit": "명", "period": "12w" }  // 근거 표시용
}
```

---

## Intent → Tool → Action 매핑

| Intent (사용자 발화) | Tool                           | Action                                      | Artifact      |
| -------------------- | ------------------------------ | ------------------------------------------- | ------------- |
| "상권 어때?"         | `get_store`, `get_kpi_summary` | `ui.open_panel`                             | KPI 카드      |
| "유동인구 보여줘"    | `get_foot_traffic_timeseries`  | `map.setLayer(footTraffic)`, `ui.showChart` | 라인차트      |
| "시간대별 분석"      | `get_foot_traffic_by_hour`     | `ui.showChart`                              | 24h 바차트    |
| "요일별 분석"        | `get_foot_traffic_by_dow`      | `ui.showChart`                              | 요일 바차트   |
| "경쟁 많아?"         | `get_competitor_density`       | `map.setMarkers(competitors)`               | 경쟁 카운트   |
| "망할까?"            | `get_open_close_rate`          | `ui.showChart`                              | 리스크 게이지 |
| "매출 추정"          | `estimate_sales`               | `ui.showChart`                              | 범위 카드     |
| "손익분기"           | `calc_break_even`              | `ui.showChart`                              | 워터폴 차트   |
| "A vs B 비교"        | `compare_commercial_areas`     | `compare.areas`                             | 비교 테이블   |
| "매물 추천"          | `recommend_real_estate`        | `map.setMarkers(listings)`                  | 매물 카드     |
| "리포트 만들어"      | -                              | `report.generate`                           | PDF 링크      |

---

## 구현 우선순위

### Phase 1: 기반 구축

- [ ] Tool 응답에 `summary`, `meta` 필드 추가
- [ ] 백엔드에서 `artifacts` 구성 로직 추가
- [ ] 프론트 응답 스키마 확장 (`artifacts`, `suggestedPrompts`)
- [ ] ChatMapSection에 히트맵/마커 기능 포팅

### Phase 2: 핵심 기능

- [ ] 유동인구 시계열/시간대/요일 분석
- [ ] 경쟁 밀도 + 마커 표시
- [ ] 개폐업률 리스크 분석
- [ ] suggestedPrompts 구현

### Phase 3: 고급 기능

- [ ] 손익분기 계산 (임대료 DB + 업종 평균 고정비)
- [ ] 매출 추정
- [ ] 상권 비교 (레이더 차트)
- [ ] 리포트 저장/공유

---

## 프론트엔드 컴포넌트 (필요 목록)

### 차트

- `LineChart` (시계열)
- `BarChart` (시간대/요일)
- `RadarChart` (상권 비교)
- `WaterfallChart` (손익분기)
- `GaugeChart` (리스크)

### 지도

- 히트맵 레이어 (MapSection에서 포팅)
- 마커 레이어 (경쟁점포, 매물)

### UI

- `SuggestedPromptChips`
- `ArtifactRenderer` (kind별 렌더링)
- `CompareTable`

---

## 손익분기(BEP) 계산 방식

```
임대료: DB에서 조회 (areaId + listingId)
인건비: 업종별 평균값 (상수)
원가율: 업종별 평균값 (상수)

BEP = (임대료 + 인건비) / (1 - 원가율)
```

업종별 평균값 예시:
| 업종 | 인건비(월) | 원가율 |
|------|-----------|--------|
| 치킨 | 300만원 | 35% |
| 카페 | 250만원 | 30% |
| 한식 | 350만원 | 40% |

---

## 시나리오 Gap 분석 (추가 필요 항목)

### 신규 Tools (시나리오 대응용)

| Tool                           | 용도                      | 시나리오       |
| ------------------------------ | ------------------------- | -------------- |
| `calc_break_even_with_listing` | 매물 임대료 반영 손익분기 | 매물 기반 BEP  |
| `get_funding_programs`         | 정부지원/대출 조건 매칭   | 대출/지원 안내 |
| `generate_action_plan`         | 다음 액션 체크리스트      | 최종 의사결정  |
| `get_survival_probability`     | 생존 확률 계산            | 망할까? 질문   |

### 신규 Actions (시나리오 대응용)

| Action                  | 용도                      | 시나리오           |
| ----------------------- | ------------------------- | ------------------ |
| `ui.askInputs`          | 사용자 입력 폼 표시       | 손익분기 입력 유도 |
| `map.highlightMultiple` | 여러 상권 동시 하이라이트 | 대체 상권 비교     |

### 신규 Artifacts (시나리오 대응용)

| Artifact Kind     | 용도                         |
| ----------------- | ---------------------------- |
| `checklist`       | 대출 준비서류, 다음 액션     |
| `comparison_card` | 상권 3개 비교 카드           |
| `risk_gauge`      | 리스크/생존확률 게이지       |
| `scenario_toggle` | 보수/기준/낙관 시나리오 토글 |

---

## 🎯 "망할 가능성" 시각화 전략

### 핵심 아이디어

사용자가 **"현실적으로 힘들다"**는 것을 직관적으로 느끼게 하려면:

1. **비교 기준 제시** - "이 상권 평균 vs 당신의 조건"
2. **확률/점수화** - 감정이 아닌 숫자로
3. **이유 설명** - 왜 힘든지 근거 제시
4. **대안 제시** - 절망이 아닌 해결책

---

### 시각화 요소

#### 1. 생존 확률 게이지 (Survival Gauge)

```
┌─────────────────────────────────────┐
│  🎯 3년 생존 확률: 32%              │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ⚠️ 업종 평균(45%)보다 낮음         │
└─────────────────────────────────────┘
```

#### 2. 리스크 요인 Top 3

```
┌─────────────────────────────────────┐
│  🔴 높은 임대료 (상위 20%)          │
│  🟠 경쟁 과밀 (반경 500m 내 12개)   │
│  🟡 유동인구 감소 추세 (-8%)        │
└─────────────────────────────────────┘
```

#### 3. 손익분기 워터폴 + 현실 비교

```
예상매출: 2,000만원
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
임대료: -500만원 ████████
인건비: -400만원 ██████
재료비: -700만원 ██████████
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
순이익: +400만원

⚠️ 업종 평균 순이익(600만원)보다 33% 낮음
⚠️ 손익분기 도달까지 18개월 예상 (평균 12개월)
```

#### 4. 시나리오 비교 토글

```
[ 보수적 ] [ 기준 ] [ 낙관적 ]

보수적 시나리오:
- 예상매출: 1,500만원 (평균 대비 -25%)
- 순이익: -100만원 (적자)
- 생존확률: 18%
```

---

### Tool 설계: `get_survival_probability`

```json
{
  "name": "get_survival_probability",
  "parameters": {
    "areaId": "string",
    "industryCode": "string",
    "monthlyRent": "number",
    "estimatedSales": "number (optional)"
  }
}
```

**응답:**

```json
{
  "data": {
    "survivalRate3Year": 32,
    "industryAverage": 45,
    "riskFactors": [
      { "factor": "high_rent", "severity": "high", "percentile": 80 },
      { "factor": "competition", "severity": "medium", "count": 12 },
      { "factor": "foot_traffic_decline", "severity": "low", "change": -8 }
    ],
    "breakEvenMonths": 18,
    "industryAverageBreakEven": 12
  },
  "summary": "3년 생존확률 32%로 업종 평균(45%)보다 낮습니다. 높은 임대료와 경쟁 과밀이 주요 리스크입니다.",
  "meta": { "basePeriod": "2023-2024", "sampleSize": 1250 }
}
```

---

### LLM 응답 예시

**사용자**: "여기서 치킨집 차리면 망할까?"

**AI 응답**:

```json
{
  "reply": "솔직히 말씀드리면, 이 상권에서 치킨집 창업은 **쉽지 않아 보여요**.\n\n3년 생존확률이 32%로 업종 평균(45%)보다 낮고, 특히 **임대료가 상위 20%로 높은 편**이에요. 반경 500m 내 경쟁 치킨집도 12개나 있어서 고객 확보가 어려울 수 있어요.\n\n다만, 유동인구는 12만명으로 양호한 편이니, **임대료를 낮출 수 있는 대안 상권**을 찾아보시는 건 어떨까요?",
  "actions": [
    { "type": "ui.showChart", "payload": { "artifactId": "risk_gauge" } }
  ],
  "suggestedPrompts": [
    "임대료 낮은 대안 상권 추천해줘",
    "그래도 여기서 하려면 어떻게 해야 돼?",
    "손익분기 자세히 계산해줘"
  ]
}
```

---

### 핵심 원칙

1. **숫자로 말하기** - "힘들어요" 대신 "생존확률 32%"
2. **비교 기준 제시** - "업종 평균 45%" vs "당신 32%"
3. **이유 설명** - "임대료 상위 20%, 경쟁 12개"
4. **희망 제시** - "대안 상권 추천해드릴까요?"
5. **행동 유도** - suggestedPrompts로 다음 단계 안내
