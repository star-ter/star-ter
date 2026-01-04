# CompareContents.tsx 변경 이력

------2025-12-30 오후 3:55 수정-------
### 수정 이유
- 가독성과 유지보수성 향상을 위한 전면 리팩토링
- `any` 타입 사용 제거 및 타입 안정성 강화
- 코드 중복 제거
- 하드코딩된 API URL 설정 파일로 분리

### 변경 내용 요약

#### 1. 타입 분리 (`types/compare-types.ts` 신규 생성)
- `LocationTarget`: 'A' | 'B' 타입 별칭
- `RegionCandidate`: 지역 검색 결과 아이템 인터페이스
- `CompareContentsProps`: 컴포넌트 Props 인터페이스
- `LocationInputProps`: LocationInput 컴포넌트 Props
- `RegionDropdownProps`: RegionDropdown 컴포넌트 Props

#### 2. API 설정 분리 (`config/api.ts` 신규 생성)
- `API_BASE_URL`: 환경변수 기반 API 기본 URL
- `API_ENDPOINTS`: API 엔드포인트 상수 객체

#### 3. 컴포넌트 분리
- `RegionDropdown.tsx`: 검색 결과 드롭다운 UI 컴포넌트 (재사용 가능)
- `LocationInput.tsx`: 지역 입력 + 검색 + 드롭다운 통합 컴포넌트 (재사용 가능)

#### 4. CompareContents.tsx 주요 변경
- 불필요한 import 제거 (`moveToLocation`)
- 모든 핸들러 함수에 `useCallback` 적용하여 메모이제이션
- `any[]` 타입을 `RegionCandidate[]`로 변경
- 중복된 Location A/B 입력 UI를 `LocationInput` 컴포넌트로 통합
- 인라인 함수 대신 명시적 핸들러 함수 사용

#### 5. 파일 구조 변경
```
apps/web/
├── config/
│   └── api.ts                    (NEW)
├── types/
│   └── compare-types.ts          (NEW)
└── components/bottom-menu/modal/
    ├── CompareContents.tsx       (MODIFIED)
    ├── LocationInput.tsx         (NEW)
    └── RegionDropdown.tsx        (NEW)
```
