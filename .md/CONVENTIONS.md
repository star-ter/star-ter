# Star-ter 프로젝트 코드 컨벤션 (CONVENTIONS.md)

## 1. 개요

이 문서는 Star-ter 프로젝트의 코드 작성 규칙을 정의합니다. 모든 기여자는 이 규칙을 준수해야 합니다.

---

## 2. 포맷팅 (Prettier)

프로젝트 루트의 `.prettierrc` 설정을 따릅니다:

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

### 주요 규칙
- **문자열**: 작은따옴표(`'`) 사용
- **후행 쉼표**: 모든 곳에 후행 쉼표 사용 (배열, 객체, 함수 파라미터 등)
- **들여쓰기**: 2 spaces (기본값)
- **세미콜론**: 사용 (기본값)

---

## 3. ESLint

### Web (Next.js)
- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`

### API (NestJS)
- NestJS 기본 ESLint 설정

---

## 4. 네이밍 컨벤션

### 4.1 파일명

| 유형 | 규칙 | 예시 |
|------|------|------|
| React 컴포넌트 | PascalCase | `AnalysisCard.tsx`, `LocationInput.tsx` |
| Hooks | camelCase (use 접두사) | `useMarketAnalysis.ts`, `useMapStore.ts` |
| 타입 정의 | kebab-case (-types 접미사) | `analysis-types.ts`, `compare-types.ts` |
| 유틸리티 | kebab-case (-utils 접미사) | `map-utils.ts` |
| Store | camelCase (use 접두사 + Store 접미사) | `useMapStore.ts`, `useComparisonStore.ts` |
| 설정 파일 | kebab-case | `api.ts` |

### 4.2 변수/함수명

| 유형 | 규칙 | 예시 |
|------|------|------|
| 변수 | camelCase | `analysisData`, `regionCode` |
| 상수 | UPPER_SNAKE_CASE | `API_BASE_URL`, `API_ENDPOINTS` |
| 함수 | camelCase (동사 시작) | `fetchData()`, `handleCompare()` |
| 이벤트 핸들러 | handle 접두사 | `handleClick()`, `handleSearch()` |
| 콜백 props | on 접두사 | `onClose`, `onChange`, `onSelect` |

### 4.3 타입/인터페이스명

| 유형 | 규칙 | 예시 |
|------|------|------|
| Interface | PascalCase | `AnalysisData`, `CompareRequest` |
| Props | PascalCase + Props 접미사 | `AnalysisCardProps`, `LocationInputProps` |
| Type Alias | PascalCase | `LocationTarget` |

---

## 5. 타입 정의 규칙

### 5.1 타입 파일 위치
- 모든 공유 타입은 `types/` 디렉토리에 정의
- 도메인별로 파일 분리: `analysis-types.ts`, `map-types.ts`, `compare-types.ts`

### 5.2 타입 정의 원칙
```typescript
// ✅ Good: 명시적 타입 정의
interface RegionCandidate {
  type: string;
  code: string;
  name: string;
  fullName?: string;
}

// ❌ Bad: any 타입 사용
const candidates: any[] = [];
```

### 5.3 Props 인터페이스 구조
```typescript
// 외부 의존성 import 먼저
import { CompareRequest } from './bottom-menu-types';

// 기본 타입 정의
export type LocationTarget = 'A' | 'B';

// 데이터 인터페이스
export interface RegionCandidate {
  type: string;
  code: string;
  name: string;
  fullName?: string;
}

// 컴포넌트 Props 인터페이스
export interface CompareContentsProps {
  onClose: () => void;
  targetA: string;
  // ...
}
```

---

## 6. 컴포넌트 작성 규칙

### 6.1 파일 구조
```typescript
// 1. 외부 라이브러리 import
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// 2. 내부 컴포넌트 import
import PillButton from '../PillButton';
import LocationInput from './LocationInput';

// 3. Store import
import { useMapStore } from '../../../stores/useMapStore';

// 4. 설정/상수 import
import { API_ENDPOINTS } from '../../../config/api';

// 5. 타입 import
import { CompareContentsProps, RegionCandidate } from '../../../types/compare-types';

// 6. 컴포넌트 정의
export default function ComponentName({ prop1, prop2 }: Props) {
  // ...
}
```

### 6.2 Hooks 사용 순서
```typescript
export default function Component(props: Props) {
  // 1. Store hooks
  const { clearMarkers } = useMapStore();

  // 2. State hooks
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(false);

  // 3. Effect hooks
  useEffect(() => { /* ... */ }, [deps]);

  // 4. Callback hooks (메모이제이션)
  const handleAction = useCallback(() => { /* ... */ }, [deps]);

  // 5. Render
  return <div>...</div>;
}
```

### 6.3 이벤트 핸들러 메모이제이션
```typescript
// ✅ Good: useCallback으로 메모이제이션
const handleChangeA = useCallback(
  (value: string) => {
    changeTargetA(value);
    setCodeA('');
  },
  [changeTargetA],
);

// ❌ Bad: 인라인 함수 (매 렌더링마다 재생성)
<input onChange={(e) => changeTargetA(e.target.value)} />
```

---

## 7. API 호출 규칙

### 7.1 API URL 관리
```typescript
// config/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  ANALYSIS_SEARCH: `${API_BASE_URL}/analysis/search`,
  ANALYSIS_DETAIL: (code: string) => `${API_BASE_URL}/analysis/${code}`,
} as const;
```

### 7.2 에러 처리
```typescript
try {
  const res = await fetch(API_ENDPOINTS.ANALYSIS_SEARCH);
  if (!res.ok) throw new Error('Search failed');
  const data: RegionCandidate[] = await res.json();
  // ...
} catch (err) {
  console.error(err);
  toast.error('지역 검색 중 오류가 발생했습니다.');
}
```

---

## 8. Store (Zustand) 작성 규칙

### 8.1 파일 구조
```typescript
import { create } from 'zustand';

// 1. 내부 데이터 인터페이스
interface DataType {
  field: string;
}

// 2. Store State 인터페이스
interface StoreState {
  data: DataType | null;
  isLoading: boolean;
  setData: (data: DataType) => void;
  reset: () => void;
}

// 3. Store 생성
export const useStoreName = create<StoreState>((set) => ({
  data: null,
  isLoading: false,
  setData: (data) => set({ data }),
  reset: () => set({ data: null, isLoading: false }),
}));
```

---

## 9. 주석 규칙

- **일반 주석**: TODO를 제외하고 사용하지 않음
- **TODO 주석**: 추후 작업이 필요한 부분에만 사용
  ```typescript
  // TODO: 에러 핸들링 개선 필요
  ```

---

## 10. 금지 사항

1. **any 타입 사용 금지** - 명시적 타입 정의 필수
2. **하드코딩된 URL 금지** - `config/api.ts` 사용
3. **미사용 import 금지** - ESLint가 검출
4. **인라인 스타일 지양** - TailwindCSS 클래스 사용
5. **console.log 남기지 않음** - 개발 완료 후 제거 (console.error는 예외)
