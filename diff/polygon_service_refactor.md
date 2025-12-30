# polygon.service.ts Refactoring

------2025-12-30 Refactoring-------
### 수정 이유
- 코드 포맷팅 (Indentation) 수정
- 중복 로직 제거 (getAdminPolygonByLowSearch 내 Gu/Dong 분기)
- 하드코딩된 '20253' 상수화
- 가독성 향상

### 변경 내용 요약
- `LATEST_QUARTER` 상수 정의
- `fetchAdminData` private helper 메소드 생성하여 Gu/Dong 로직 통합
- Prisma 쿼리 구조 개선
