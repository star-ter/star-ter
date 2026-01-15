# Implementation Plan - AI Chat Enhancement

> 이 문서는 AI 챗 기능 고도화 작업의 세부 구현 계획입니다.
> Codex 또는 다른 AI가 작업을 이어받을 때 이 문서를 참고하세요.

## 📍 현재 상태 (2026-01-13)

### 완료된 작업

- [x] 프론트엔드 Action Dispatcher 패턴 구현
- [x] 백엔드 프롬프트 중앙화 (`constants/prompts.ts`)
- [x] Vector DB 기반 지역/업종 코드 추출 구현
- [x] `plan.md` 현재 코드베이스와 정렬
- [x] 아키텍처 결정: **LLM이 artifacts 직접 생성**

### 핵심 파일 위치

| 역할               | 파일 경로                                     |
| ------------------ | --------------------------------------------- |
| AI 서비스 메인     | `apps/api/src/ai/ai.service.ts`               |
| OpenAI 호출        | `apps/api/src/ai/openAI/open-ai.service.ts`   |
| Tool 실행          | `apps/api/src/ai/ai-tools.service.ts`         |
| Tool 정의          | `apps/api/src/ai/tools/definitions.ts`        |
| 응답 스키마        | `apps/api/src/ai/schemas/response-schemas.ts` |
| 프롬프트           | `apps/api/src/ai/constants/prompts.ts`        |
| Vector 검색        | `apps/api/src/ai/ai.repository.ts`            |
| 프론트 액션 핸들러 | `apps/web/components/chat/actions/`           |

---

## 🏗️ 아키텍처 원칙

**LLM이 모든 필드 생성**: `reply`, `actions`, `artifacts`, `suggestedPrompts`를 모두 LLM이 Structured Output으로 생성

- Tool은 raw data만 반환 (현재 그대로 유지)
- Backend는 좌표 패치만 수행
- 프론트는 LLM 응답 그대로 렌더링

---

## 🚀 Phase 1: 기반 구축

### Task 1.1: Structured Output 스키마 확장

**상태**: ✅ 완료 (테스트 통과)

**작업 파일**:

- `apps/api/src/ai/schemas/response-schemas.ts` - artifacts, suggestedPrompts 추가
- `apps/web/lib/api/ai.ts` - Artifact, ArtifactSpec, ArtifactDataPoint 타입 추가

**테스트 결과**:

- ✅ 일반 질문: artifacts 빈 배열, suggestedPrompts 3개 생성
- ✅ 차트 요청: artifacts에 bar chart 데이터 정상 생성

---

### Task 1.2: 프론트 응답 타입 확장

**상태**: ✅ 완료 (Task 1.1과 동시 완료)

**작업 파일**:

- `apps/web/lib/api/ai.ts`

---

### Task 1.3: ChatMapSection에 히트맵/마커 기능 포팅

**상태**: ⬜ 미시작

**작업 파일**:

- `apps/web/components/chat/ChatMapSection.tsx`
- `apps/web/components/chat/actions/mapActionHandler.ts`

---

## 🔧 Phase 2: 핵심 기능

- Task 2.1: 유동인구 시계열 Tool 추가
- Task 2.2: 시간대/요일별 분석 Tool 추가
- Task 2.3: 경쟁 밀도 Tool + 마커 표시
- Task 2.4: suggestedPrompts UI 구현

---

## 📊 Phase 3: 고급 기능

- Task 3.1: 손익분기 계산 Tool
- Task 3.2: 생존 확률 계산 Tool
- Task 3.3: 상권 비교
- Task 3.4: 리포트 저장/공유

---

## 📝 작업 로그

| 날짜       | 작업 내용                           | 담당        |
| ---------- | ----------------------------------- | ----------- |
| 2026-01-13 | Implementation Plan 문서 생성       | Antigravity |
| 2026-01-13 | 아키텍처 변경: LLM이 artifacts 생성 | Antigravity |

---

## ⚠️ 주의사항

1. **LLM이 artifacts 포함 모든 필드 생성**: Structured Output 스키마에 정의 필요
2. **Vector DB 필수**: Tool 호출 전 반드시 `getCategories()`, `getAreaInfo()` 실행
3. **좌표 패치**: LLM이 생성한 좌표는 부정확할 수 있으므로 `patchCoordinates()` 필수
