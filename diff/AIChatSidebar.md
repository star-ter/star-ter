------2025-12-26 오후 10:05 수정-------
### 수정 이유
- 사용자 요청에 따라 AIChatSidebar의 모서리를 둥글게 변경하여 디자인 개선.

### 변경 내용 요약
- `AIChatSidebar.tsx`의 내부 구조 변경:
    - 외부 `aside` 요소는 투명한 컨테이너 역할만 수행 (Resizer 포함).
    - 실제 컨텐츠(Header, Main, Input)를 담는 내부 `div` Wrapper를 추가.
    - Wrapper에 `rounded-l-3xl` 및 `overflow-hidden`을 적용하여 좌측 모서리를 둥글게 처리하고 내부 컨텐츠가 모서리를 벗어나지 않도록 함.
    - 기존 `aside`에 있던 배경색, 테두리, 그림자 스타일을 내부 Wrapper로 이동.
