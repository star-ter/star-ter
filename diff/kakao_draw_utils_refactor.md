# kakao-draw-utils Refactoring

------2025-12-30 Refactoring-------
### 수정 이유
- 함수가 너무 거대하여 가독성이 떨어짐 (300줄 이상) -> Helper 함수 분리
- HTML 생성 로직이 복잡함 -> 별도 함수로 추출
- Top 3 로직 분리
- Any 타입 제거

### 변경 내용 요약
- `getTop3Features` 함수 분리
- `createMarkerContent` 함수 분리
- `drawPolygons` 함수 단순화
- Type Guard 강화
