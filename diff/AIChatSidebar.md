------2025-12-26 오후 10:50 수정-------
### 수정 이유
- 채팅 메시지가 추가되거나 로딩 상태일 때, 자동으로 스크롤이 최하단으로 이동하도록 기능을 추가.

### 변경 내용 요약
- `AIChatSidebar.tsx`:
    - `messagesEndRef` (useRef) 추가.
    - `scrollToBottom` 함수 구현 (smooth scroll).
    - `useEffect`로 `optimisticMessages`나 `isPending` 변경 시 자동 스크롤 트리거.
    - 메시지 리스트 최하단에 `<div ref={messagesEndRef} />` 삽입.
