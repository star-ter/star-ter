# Store Tab Synchronization 변경 이력

------2025-12-30 오후 4:15 수정-------
### 수정 이유
- 상권 비교 시 두 분석 카드의 매장 탭 '더보기' 버튼 상태를 동기화하여 사용자 경험 개선

### 변경 내용 요약

#### 1. 타입 수정 (`types/analysis-types.ts`)
- `AnalysisCardProps`에 `isStoreExpanded`, `onStoreExpand` 옵셔널 prop 추가

#### 2. ComparisonOverlay 수정 (`comparison/ComparisonOverlay.tsx`)
- `isStoreExpanded` 상태 추가 (기본값 false)
- 두 `AnalysisCard`에 해당 상태와 setter 전달하여 동기화 구현

#### 3. AnalysisCard 수정 (`comparison/AnalysisCard.tsx`)
- Props로 받은 `isStoreExpanded`, `onStoreExpand`를 `StoreTabContent`로 전달

#### 4. StoreTabContent 수정 (`comparison/StoreTabContent.tsx`)
- Controlled/Uncontrolled 모드 지원
- Props로 `isExpanded`가 전달되면 해당 값을 사용하고, `onExpand` 콜백 호출
- Props가 없으면 기존처럼 로컬 상태 사용 (단독 사용 시 호환성 유지)
