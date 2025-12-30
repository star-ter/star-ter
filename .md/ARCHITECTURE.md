# Star-ter 프로젝트 아키텍처 (ARCHITECTURE.md)

## 1. 개요

Star-ter는 상권 분석 서비스를 제공하는 풀스택 웹 애플리케이션입니다.
Turborepo를 사용한 모노레포 구조로, 프론트엔드(Next.js)와 백엔드(NestJS)가 분리되어 있습니다.

---

## 2. 프로젝트 구조

```
star-ter/
├── apps/
│   ├── web/                    # 프론트엔드 (Next.js)
│   └── api/                    # 백엔드 (NestJS)
├── diff/                       # 변경 이력 문서
├── docker/                     # Docker 설정
├── infra/                      # 인프라 설정
├── .prettierrc                 # Prettier 설정
├── turbo.json                  # Turborepo 설정
└── pnpm-workspace.yaml         # PNPM 워크스페이스 설정
```

---

## 3. 프론트엔드 아키텍처 (apps/web)

### 3.1 디렉토리 구조

```
apps/web/
├── app/                        # Next.js App Router
├── components/                 # React 컴포넌트
│   ├── bottom-menu/           # 하단 메뉴 관련
│   │   ├── modal/             # 모달 컴포넌트
│   │   ├── BottomMenuBox.tsx
│   │   └── PillButton.tsx
│   ├── comparison/            # 비교 분석 관련
│   │   ├── AnalysisCard.tsx
│   │   ├── SalesTrendGraph.tsx
│   │   └── ...
│   ├── sidebar/               # 사이드바 관련
│   ├── common/                # 공통 컴포넌트
│   └── ...
├── config/                    # 설정 파일
│   └── api.ts                 # API 엔드포인트 설정
├── hooks/                     # Custom Hooks
│   ├── useMarketAnalysis.ts
│   ├── usePolygonData.ts
│   └── ...
├── services/                  # API 서비스 레이어
│   ├── chat/
│   ├── geocoding/
│   └── population/
├── stores/                    # Zustand 상태 관리
│   ├── useMapStore.ts
│   ├── useComparisonStore.ts
│   └── useSidebarStore.ts
├── types/                     # TypeScript 타입 정의
│   ├── analysis-types.ts
│   ├── compare-types.ts
│   ├── map-types.ts
│   └── ...
├── utils/                     # 유틸리티 함수
└── mocks/                     # 목업 데이터
```

### 3.2 레이어 구조

```
┌─────────────────────────────────────────────────────────┐
│                      Components                          │
│  (AnalysisCard, CompareContents, LocationInput, ...)    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                        Hooks                             │
│  (useMarketAnalysis, usePolygonData, ...)               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                       Stores                             │
│  (useMapStore, useComparisonStore, useSidebarStore)     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Services / API                        │
│  (fetch calls via config/api.ts)                        │
└─────────────────────────────────────────────────────────┘
```

### 3.3 컴포넌트 분류

| 분류 | 설명 | 예시 |
|------|------|------|
| **Feature Components** | 특정 기능을 담당하는 컴포넌트 | `AnalysisCard`, `CompareContents` |
| **UI Components** | 재사용 가능한 UI 요소 | `PillButton`, `LocationInput`, `RegionDropdown` |
| **Layout Components** | 레이아웃 구조 담당 | `BottomMenuBox`, `ModalCard` |
| **Common Components** | 범용 유틸리티 컴포넌트 | `AnimatedNumber` |

### 3.4 상태 관리 전략

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   useMapStore    │     │useComparisonStore│     │ useSidebarStore  │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ - center         │     │ - isVisible      │     │ - isOpen         │
│ - zoom           │     │ - dataA          │     │ - messages       │
│ - markers        │     │ - dataB          │     │                  │
│ - moveToLocation │     │ - openComparison │     │                  │
│ - clearMarkers   │     │ - closeComparison│     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## 4. 백엔드 아키텍처 (apps/api)

### 4.1 디렉토리 구조

```
apps/api/src/
├── analysis/                  # 상권 분석 모듈
│   ├── analysis.controller.ts
│   ├── analysis.service.ts
│   └── analysis.module.ts
├── market/                    # 마켓 데이터 모듈
├── polygon/                   # 폴리곤 데이터 모듈
├── floating-population/       # 유동인구 모듈
├── revenue/                   # 매출 모듈
├── store/                     # 점포 모듈
├── geo/                       # 지리 정보 모듈
├── ai/                        # AI 관련 모듈
├── prisma/                    # Prisma 서비스
├── types/                     # 타입 정의
│   └── analysis.ts
├── app.module.ts              # 앱 모듈
└── main.ts                    # 엔트리 포인트
```

### 4.2 NestJS 모듈 구조

```
┌─────────────────────────────────────────────────────────┐
│                      AppModule                           │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
  │AnalysisModule │ │ MarketModule  │ │ PolygonModule │
  └───────────────┘ └───────────────┘ └───────────────┘
          │                │                │
          ▼                ▼                ▼
  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
  │   Controller  │ │   Controller  │ │   Controller  │
  └───────────────┘ └───────────────┘ └───────────────┘
          │                │                │
          ▼                ▼                ▼
  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
  │    Service    │ │    Service    │ │    Service    │
  └───────────────┘ └───────────────┘ └───────────────┘
                           │
                           ▼
              ┌───────────────────────┐
              │     PrismaService     │
              └───────────────────────┘
```

### 4.3 Analysis 모듈 상세

```typescript
// Controller: HTTP 요청 처리
@Controller('analysis')
export class AnalysisController {
  @Get('search')           // GET /analysis/search?query=...
  searchRegions() {}

  @Get(':regionCode')      // GET /analysis/:regionCode
  getAnalysis() {}
}

// Service: 비즈니스 로직
@Injectable()
export class AnalysisService {
  getAnalysis(regionCode: string): Promise<AnalysisResponse>
  searchRegions(query: string): Promise<RegionResult[]>
}
```

---

## 5. 데이터 흐름

### 5.1 상권 비교 기능 흐름

```
[사용자 입력]
     │
     ▼
┌─────────────────────┐
│  CompareContents    │  사용자가 두 지역 선택
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  searchRegion()     │  지역 검색 API 호출
│  (useCallback)      │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  GET /analysis/     │  백엔드 검색 API
│  search?query=...   │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  AnalysisService.   │  Prisma로 DB 조회
│  searchRegions()    │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  RegionDropdown     │  검색 결과 표시
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  handleCompare()    │  비교 분석 요청
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  useComparisonStore │  비교 결과 저장
│  openComparison()   │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  AnalysisCard x 2   │  비교 UI 렌더링
└─────────────────────┘
```

### 5.2 분석 데이터 구조

```typescript
interface AnalysisResponse {
  meta: {
    yearQuarter: string;      // "20233" (2023년 3분기)
    regionCode: string;
    matchedRegions: string[];
    type: 'GU' | 'DONG' | 'COMMERCIAL';
  };
  sales: {
    total: string;            // 총 매출 (문자열 - BigInt)
    trend: SalesTrendItem[];  // 분기별 트렌드
    dayOfWeek: DayOfWeekSalesItem[];  // 요일별
    timeOfDay: TimeOfDaySalesItem[];  // 시간대별
    gender: GenderSalesItem;  // 성별
    age: AgeSalesItem;        // 연령대별
  };
  store: {
    total: number;
    categories: StoreCategoryItem[];
    openingRate: number;
    closingRate: number;
  };
  population: PopulationData | null;
}
```

---

## 6. API 엔드포인트

### 6.1 Analysis API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/analysis/search?query={keyword}` | 지역 검색 |
| GET | `/analysis/:regionCode` | 지역 분석 데이터 조회 |

### 6.2 Market API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/market/stores?latitude=...&longitude=...&polygon=...` | 점포 목록 |
| GET | `/market/analytics?...` | 상권 분석 |

---

## 7. 기술 스택

### 프론트엔드
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Charts**: (분석 그래프용)
- **Toast**: react-hot-toast
- **Icons**: react-icons

### 백엔드
- **Framework**: NestJS
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: (Prisma로 추상화)

### DevOps
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Container**: Docker

---

## 8. 확장 가이드

### 8.1 새 분석 모듈 추가

1. `apps/api/src/{module-name}/` 디렉토리 생성
2. Controller, Service, Module 파일 생성
3. `app.module.ts`에 모듈 등록
4. `apps/web/types/{module}-types.ts` 타입 정의
5. `apps/web/hooks/use{Module}.ts` 훅 생성

### 8.2 새 UI 컴포넌트 추가

1. 재사용성 판단
   - 재사용 가능 → `components/common/` 또는 해당 도메인 폴더
   - 특정 기능 전용 → 해당 feature 폴더
2. Props 인터페이스를 `types/` 폴더에 정의
3. 컴포넌트 구현
4. 필요시 Storybook 스토리 추가
