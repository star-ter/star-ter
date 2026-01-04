# Store Tab Hover Style Remove 변경 이력

------2025-12-30 오후 4:26 수정-------
### 수정 이유
- 사용자의 요청에 따라 매장 탭 업종 리스트 항목 호버 시 발생하는 시각적 변화(텍스트 색상, 그래프 투명도 등)를 제거하여, 정보 확인(툴팁) 기능에만 집중하도록 개선

### 변경 내용 요약

#### 1. StoreTabContent 수정 (`comparison/StoreTabContent.tsx`)
- 업종 리스트 아이템 컨테이너에서 `group` 클래스 제거
- 텍스트(`span`)에서 `group-hover:text-blue-600`, `group-hover:font-bold` 클래스 제거
- 그래프 바(`div`)에서 `group-hover:opacity-100` 클래스 제거 및 `opacity-70` 유지
- 확장 아이콘 컨테이너(`div`)에서 `group-hover:text-blue-600` 클래스 제거
- 확장 아이콘(`ChevronUp/Down`)에서 `group-hover:stroke-[3]` 클래스 제거
