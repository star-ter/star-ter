------2025-12-26 오후 11:06 수정-------
### 수정 이유
- 채팅 입력창(Textarea)이 포커스될 때 높이가 확장(`h-14` -> `h-32`)되면서 최신 메시지를 가리는 문제 해결.

### 변경 내용 요약
- `AIChatSidebar.tsx`: Textarea에 `onFocus` 핸들러 추가.
    - 포커스 시 300ms(CSS transition 시간) 후 `scrollToBottom`을 호출하여, 입력창이 커진 후에도 최신 메시지가 보이도록 스크롤 위치 조정.
