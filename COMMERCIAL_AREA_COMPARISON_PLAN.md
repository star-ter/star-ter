# 상권 배후지 비교 기능 구현 계획

## 📋 개요

두 개의 상권 배후지를 선택하여 업종별 점포수, 매출, 유동인구, 주거인구 등의 지표를 비교 분석하는 기능 구현

---

## ✅ 전제 조건 (이미 구현되어 있음)

다음 기능들은 **이미 구현되어 있다고 가정**합니다:

- ✅ **데이터베이스 스키마**: 상권, 업종별 점포수/매출, 유동인구, 주거인구 테이블
- ✅ **단일 상권 조회 API**: 특정 상권의 폴리곤 및 기본 정보 조회
- ✅ **업종별 점포수 API**: 특정 상권의 업종별 점포 수 조회
- ✅ **업종별 매출 API**: 특정 상권의 업종별 매출액 조회
- ✅ **유동인구 API**: 특정 상권의 시간대별/연령대별 유동인구 조회
- ✅ **주거인구 API**: 특정 상권의 연령대별 주거인구 및 세대수 조회
- ✅ **지도 렌더링**: Kakao Map 기반 폴리곤 표시 기능

---

## 🎯 새로 구현할 기능

### 핵심 기능
1. **상권 배후지 선택**
   - 지도에서 2개의 폴리곤 선택
   - 선택된 상권 정보 표시

2. **비교 지표**
   - 업종별 점포수
   - 업종별 매출액
   - 유동인구 (시간대별, 연령대별)
   - 주거인구 (연령대별, 세대수)

3. **비교 결과 시각화**
   - 나란히 비교 (Side-by-side)
   - 차트 기반 비교 (막대 그래프, 방사형 차트)
   - 차이/비율 표시
스키마 (참고용 - 이미 존재)

기존 API를 통해 다음 데이터를 조회할 수 있다고 가정:

```typescript
// 기존 API 응답 예시
interface AreaData {
  areaCode: string;
  areaName: string;
  polygon: number[][][];
  stores: { category: string; count: number }[];
  sales: { category: string; amount: number }[];
  floatingPopulation: {
    byTimeSlot: { timeSlot: string; count: number }[];
    byAgeGroup: { ageGroup: string; count: number }[];
  };
  residentialPopulation: {
    byAgeGroup: { ageGroup: string; count: number }[];
    households: number;
  };
}population_count INTEGER NOT NULL,
  year_month VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 주거인구 정보
CREATE TABLE residential_population (
  id SERIAL PRIMARY KEY,
  area_code VARCHAR(20) REFERENCES commercial_area(area_code),
  age_group VARCHAR(10),
  household_count INTEGER,
  population_count INTEGER NOT NULL,
  year_month VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Backend API 설계 (NestJS)

### 1. 디렉토리 구조

```
apps/api/src/
├── commercial-area/
│   ├── commercial-area.module.ts
│   ├── commercial-area.controller.ts
│   ├── commercial-area.service.ts
│   ├── dto/
│   │   ├── area-comparison.dto.ts
│   │   ├── area-detail.dto.ts
│   │   └── comparison-request.dto.ts
│   └── entities/
│       ├── commercial-area.entity.ts
│       ├── store-by-category.entity.ts
│       └── ...
```

### 2. API 엔드포인트

#### 2.1 상권 목록 조회
```typescript
GET /api/commercial-area
Response: {
  areas: [
    {
      areaCode: "SA001",
      areaName: "강남역 상권",
      polygon: [...],
      x: 127.027,
      y: 37.497
    }
  ]
}
```

#### 2.2 상권 상세 정보 조회
```typescript
GET /api/commercial-area/:areaCode
Response: {
  areaCode: "SA001",
  areaName: "강남역 상권",
  storesByCategory: [      # 비교 엔드포인트 추가
│   ├── commercial-area.service.ts         # 비교 로직 추가
│   ├── dto/
│   │   ├── area-comparison.dto.ts         # 🆕 새로 추가
│   │   ├── area-detail.dto.ts             # ✅ 이미 존재
│   │   └── comparison-request.dto.ts      # 🆕 새로 추가
```

### 2. 기존 API (이미 구현됨)

```typescript
// ✅ 이미 존재하는 API들
GET /api/commercial-area                    // 상권 목록
GET /api/commercial-area/:areaCode          // 상권 상세 정보
GET /api/commercial-area/:areaCode/stores   // 업종별 점포수
GET /api/commercial-area/:areaCode/sales    // 업종별 매출
// ... 기타 API
```

### 3. 새로 추가할 API (🆕 비교al: 3000000000, percentage: 20.0 },
      floatingPopulation: { total: 10000, percentage: 20.0 },
      residentialPopulation: { total: 2000, percentage: 16.7 }
    }
  }
}
```

### 3. DTO 정의

```typescript
// apps/api/src/commercial-area/dto/comparison-request.dto.ts
export class ComparisonRequestDto {
  @IsString()
  areaCode1: string;

  @IsString()
  areaCode2: string;

  @IsString()
  @IsOptional()
  yearMonth?: string; // YYYYMM format
}

// apps/api/src/commercial-area/dto/area-comparison.dto.ts
export class AreaComparisonResponse {
  comparison: {
    area1: AreaDetailDto;
    area2: AreaDetailDto;
    diff: ComparisonDiffDto;
  };
}

export class ComparisonDiffDto {
  stores: { total: number; percentage: number };
  sales: { total: number; percentage: number };
  floatingPopulation: { total: number; percentage: number };
  residentialPopulation: { total: number; percentage: number };
}
```

### 4. Service 구현

```typescript
// apps/api/src/commercial-area/commercial-area.service.ts
@Injectable()
export class CommercialAreaService {
  constructor(private prisma: PrismaService) {}

  async compareAreas(dto: ComparisonRequestDto): Promise<AreaComparisonResponse> {
    const [area1, area2] = await Promise.all([
      this.getAreaDetail(dto.areaCode1, dto.yearMonth),
      this.getAreaDetail(dto.areaCode2, dto.yearMonth),
    ]);

    const diff = this.calculateDifference(area1, area2);

    return {
      comparison: { area1, area2, diff }
    };
  }

  private calculateDifference(area1: AreaDetailDto, area2: AreaDetailDto) {
    return {
      stores: {
        total: area1.stores.total - area2.stores.total,
        percentage: ((area1.stores.total - area2.stores.total) / area2.stores.total) * 100
      },
      // ... 나머지 계산
    };
  }
}
```

---

## 🎨 Frontend 설계 (Next.js)

### 1. 디렉토리 구조

```
apps/web/
├── app/
│   └── comparison/
│       └── page.tsx
├── components/
│   ├── comparison/
│   │   ├── AreaSelector.tsx
│   │   ├── ComparisonView.tsx
│   │   ├── ComparisonChart.tsx
│   │   ├── StoreComparison.tsx
│   │   ├── SalesComparison.tsx
│   │   ├── PopulationComparison.tsx
│   │   └── DiffIndicator.tsx
│   └── map/
│       └── ComparisonMapBox.tsx
├── services/
│   └── commercial-area/
│       ├── commercial-area.service.ts
│       └── types.ts
└── utils/
    └── comparison-utils.ts
```

### 2. 주요 컴포넌트

#### 2.1 비교 페이지 (page.tsx)
```typescript
// apps/web/app/c (🆕 비교 로직만 추가)

```typescript
// apps/api/src/commercial-area/commercial-area.service.ts
@Injectable()
export class CommercialAreaService {
  constructor(priva                    # 🆕 새로 추가
│       └── page.tsx
├── components/
│   ├── comparison/                    # 🆕 새로 추가 (전체 디렉토리)
│   │   ├── AreaSelector.tsx
│   │   ├── ComparisonView.tsx
│   │   ├── ComparisonChart.tsx
│   │   ├── StoreComparison.tsx
│   │   ├── SalesComparison.tsx
│   │   ├── PopulationComparison.tsx
│   │   └── DiffIndicator.tsx
│   ├── map/
│   │   └── MapBox.tsx                 # ✅ 이미 존재 (수정 필요)
│   └── kakaomap.tsx                   # ✅ 이미 존재 (다중 선택 기능 추가)
├── services/
│   └── commercial-area/
│       ├── commercial-area.service.ts # 🆕 비교 메서드 추가
│       └── types.ts                   # 🆕 비교 타입 추가
└── utils/
    └── comparison-utils.ts            # 🆕 새로 추가
    return {
      comparison: { area1, area2, diff }
    };
  }

  // 🆕 새로 추가: 차이 계산 유틸리티
  private calculateDifference(area1: AreaDetailDto, area2: AreaDetailDto) {
    return {
      stores: {
        total: area1.stores.total - area2.stores.total,
        percentage: ((area1.stores.total - area2.stores.total) / area2.stores.total) * 100
      },
      sales: {
        total: area1.sales.total - area2.sales.total,
        percentage: ((area1.sales.total - area2.sales.total) / area2.sales.total) * 100
      },
      floatingPopulation: {
        total: area1.floatingPopulation.total - area2.floatingPopulation.total,
        percentage: ((area1.floatingPopulation.total - area2.floatingPopulation.total) / area2.floatingPopulation.total) * 100
      },
      residentialPopulation: {
        total: area1.residentialPopulation.total - area2.residentialPopulation.total,
        percentage: ((area1.residentialPopulation.total - area2.residentialPopulation.total) / area2.residentialPopulation.total) * 100
      }

      {comparisonData && (
        <ComparisonView data={comparisonData} />
      )}
    </div>
  );
}
```

#### 2.2 비교 뷰 컴포넌트
```typescript
// apps/web/components/comparison/ComparisonView.tsx
export function ComparisonView({ data }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="area-column">
        <h2>{data.comparison.area1.areaName}</h2>
        <StoreComparison data={data.comparison.area1.stores} />
        <SalesComparison data={data.comparison.area1.sales} />
        <PopulationComparison 
          floating={data.comparison.area1.floatingPopulation}
          residential={data.comparison.area1.residentialPopulation}
        />
      </div>

      <div className="area-column">
        <h2>{data.comparison.area2.areaName}</h2>
        <StoreComparison data={data.comparison.area2.stores} />
        <SalesComparison data={data.comparison.area2.sales} />
        <PopulationComparison 
          floating={data.comparison.area2.floatingPopulation}
          residential={data.comparison.area2.residentialPopulation}
        />
      </div>

      <div className="col-span-2">
        <h2>차이 분석</h2>
        <ComparisonChart diff={data.comparison.diff} />
      </div>
    </div>
  );
}
```

#### 2.3 차트 컴포넌트
```typescript
// apps/web/components/comparison/ComparisonChart.tsx
import { BarChart, RadarChart } from 'recharts'; // or Chart.js

export function ComparisonChart({ diff }) {
  const chartData = [
    { metric: '점포수', value: diff.stores.percentage },
    { metric: '매출액', value: diff.sales.percentage },
    { metric: '유동인구', value: diff.floatingPopulation.percentage },
    { metric: '주거인구', value: diff.residentialPopulation.percentage },
  ];

  return (
    <div>
      <BarChart data={chartData} />
      <RadarChart data={chartData} />
    </div>
  );
}
```

### 3. 서비스 레이어

```typescript
// apps/web/services/commercial-area/commercial-area.service.ts
class CommercialAreaService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  async compareAreas(request: ComparisonRequest): Promise<ComparisonResponse> {
    const response = await fetch(`${this.baseUrl}/commercial-area/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error('Failed to compare areas');
    return response.json();
  }

  async getAreaList(): Promise<Area[]> {
    const response = await fetch(`${this.baseUrl}/commercial-area`);
    if (!response.ok) throw new Error('Failed to fetch areas');
    return response.json();
  }
}

export const commercialAreaService = new CommercialAreaService();
```

---

## 🎨 UI/UX 설계

### 1. 화면 레이아웃

```
┌─────────────────────────────────────────────────┐
│  지도 영역 (폴리곤 선택)                           │
│  - 선택된 상권 1: 강남역 상권 [X]                 │
│  - 선택된 상권 2: 홍대 상권 [X]                   │
│  [비교하기 버튼]                                  │
└─────────────────────────────────────────────────┘
┌──────────────────┬──────────────────┬──────────┐
│   강남역 상권      │    홍대 상권       │   차이   │
├──────────────────┼──────────────────┼──────────┤
│ 점포수: 1,250    │ 점포수: 1,050    │ +200    │
│ 매출: 150억      │ 매출: 120억      │ +30억   │
│ 유동인구: 50,000 │ 유동인구: 40,000 │ +10,000 │
│ 주거인구: 12,000 │ 주거인구: 10,000 │ +2,000  │
└──────────────────┴──────────────────┴──────────┘
┌─────────────────────────────────────────────────┐
│  상세 비교 차트                                   │
│  - 업종별 점포수 비교 (막대 그래프)                │
│  - 업종별 매출 비교 (막대 그래프)                  │
│  - 시간대별 유동인구 비교 (선 그래프)              │
│  - 연령대별 인구 비교 (파이 차트)                  │
└─────────────────────────────────────────────────┘
```

### 2. 인터랙션 플로우

1. **상권 선택**
   - 지도에서 폴리곤 클릭 → 선택 상태 표시 (하이라이트)
   - 최대 2개까지 선택 가능
   - 선택 취소 가능 (X 버튼)

2. **비교 실행**
   - "비교하기" 버튼 클릭
   - 로딩 인디케이터 표시
   - 비교 결과 애니메이션과 함께 표시

3. **결과 탐색**
   - 스크롤로 상세 비교 차트 탐색
   - 차트 호버 시 툴팁 표시
   - 탭으로 카테고리별 비교 전환

---

## 📦 구현 순서

### Phase 1: Backend 기반 구축 (1-2일)
- [x] Prisma 스키마 정의
- [x] Migration 실행
- [x] Mock 데이터 생성
- [x] CommercialAreaModule 생성

### Phase 2: API 구현 (2-3일)
- [x] 상권 목록 조회 API
- [x] 상권 상세 조회 API
- [x] 상권 비교 API (핵심)비교 API 구현 (1일)
- [ ] `ComparisonRequestDto` 작성
- [ ] `AreaComparisonResponse` DTO 작성
- [ ] `compareAreas()` 메서드 구현
- [ ] `calculateDifference()` 유틸리티 구현
- [ ] `/api/commercial-area/compare` 엔드포인트 추가
- [ ] 단위 테스트 작성

### Phase 2: Frontend 타입 및 서비스 레이어 (0.5일)
- [ ] 비교 관련 타입 정의 (`types.ts`)
- [ ] `commercialAreaService.compareAreas()` 메서드 추가
- [ ] `comparison-utils.ts` 유틸리티 함수 작성

### Phase 3: 지도 다중 선택 기능 (1일)
- [ ] `kakaomap.tsx`에 다중 선택 모드 추가
- [ ] 선택된 폴리곤 상태 관리 (최대 2개)
- [ ] 폴리곤 하이라이트 효과
- [ ] 선택 취소 기능
- [ ] 선택 완료 콜백

### Phase 4: 비교 페이지 및 레이아웃 (1일)
- [ ] `/app/comparison/page.tsx` 작성
- [ ] 기본 레이아웃 구성
- [ ] 상권 선택 UI
- [ ] 비교하기 버튼 및 로딩 상태

### Phase 5: 비교 결과 컴포넌트 (2일)
- [ ] `ComparisonView.tsx` - 전체 비교 뷰
- [ ] `StoreComparison.tsx` - 점포수 비교
- [ ] `SalesComparison.tsx` - 매출 비교
- [ ] `PopulationComparison.tsx` - 인구 비교
- [ ] `DiffIndicator.tsx` - 차이 표시 컴포넌트

### Phase 6: 차트 및 시각화 (1.5일)
- [ ] 차트 라이브러리 설치 (Recharts)
- [ ] `ComparisonChart.tsx` 구현
- [ ] 막대 그래프 (업종별 비교)
- [ ] 방사형 차트 (종합 비교)
- [ ] 선 그래프 (시계열 비교)

### Phase 7: 테스트 및 최적화 (1일)
- [ ] E2E 테스트 작성
- [ ] 에러 핸들링 개선
- [ ] 반응형 디자인 조정
- [ ] 성능 최적화
- [ ] 접근성 개선

**총 예상 기간: 7-8: class-validator, class-transformer

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Charts**: Recharts / Chart.js
- **State Management**: React Hooks (useState, useReducer)
- **Styling**: Tailwind CSS

### 공통
- **Language**: TypeScript
- **Monorepo**: Turborepo
- **Package Manager**: pnpm

---

## 🚀 배포 전략

### 환경 변수
```env
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/db
API_PORT=3000

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Docker 배포
```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]
```

---

## 📝 추가 고려사항

### 1. 성능 최적화
- 비교 결과 캐싱 (Redis)
- 대용량 데이터 페이지네이션
- 차트 렌더링 최적화 (Virtual Scrolling)

### 2. 확장 가능성
- 3개 이상 상권 비교
- 시계열 비교 (월별, 분기별)
- CSV/PDF 내보내기
- 비교 결과 저장/공유 기능

### 3. 접근성
- 키보드 네비게이션
- 스크린 리더 지원
- 색상 대비 개선

### 4. 에러 처리
- API 타임아웃 처리
- 잘못된 상권 코드 처리
- 데이터 없는 경우 처리

---

## 📚 참고 자료

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma ORM](https://www.prisma.io/docs)
- [Recharts Documentation](https://recharts.org/)

---

## ✅ 체크리스트

- [ ] 데이터베이스 스키마 설계 완료
- [ ] Backend API 구현 완료
- [ ] Frontend 컴포넌트 구현 완료
- [ ] 테스트 작성 완료
- [ ] 문서화 완료
- [ ] 코드 리뷰 완료
- [ ] QA 테스트 완료
- [ ] 배포 준비 완료
