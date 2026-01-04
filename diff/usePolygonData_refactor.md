# usePolygonData Refactoring

------2025-12-30 Refactoring-------
### 수정 이유
- CONVENTIONS.md 준수 (Code Style, Import Order, No Console Log, No Any)
- 하드코딩된 API URL 제거

### 변경 내용 요약
- `API_BASE_URL` 제거하고 `config/api.ts`의 `API_ENDPOINTS` 사용
- `console.log`, `console.time` 제거
- `any` 타입 제거 및 명시적 타입 (`unknown` + Type Guard or Assertion) 사용
- Hook 선언 순서 정리
- 변수명 명확화 (`map` -> `mapInstance` in callbacks to avoid confusion with closure)
