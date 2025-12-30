# Store Tab Tooltip 추가 이력

------2025-12-30 오후 4:21 수정-------
### 수정 이유
- 사용자 요청에 따라 매장 탭 업종별 상세 정보(개업/폐업)에 해당 데이터의 기준 분기를 보여주는 툴팁 기능 추가

### 변경 내용 요약

#### 1. StoreTabContent 수정 (`comparison/StoreTabContent.tsx`)
- `lucide-react`에서 `AlertCircle` 아이콘 추가 import
- 개업/폐업 정보 컨테이너(`div.flex`) 우측에 툴팁 그룹 추가
- `group/tooltip` 및 `group-hover/tooltip` 클래스를 활용하여 호버 시 툴팁 표시 구현
- `data.meta.yearQuarter` 데이터를 "YYYY년 Q분기" 형식으로 포맷팅하여 표시
- 툴팁 화살표 및 스타일링 적용 (TailwindCSS 사용)
