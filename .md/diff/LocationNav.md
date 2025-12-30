
------2025-12-30 오후 12:55 수정 (Refactoring)-------
### 수정 이유
- CONVENTIONS.md 및 ARCHITECTURE.md 규칙 준수를 위한 리팩토링 요청
- 컴포넌트(`LocationNav`)와 비즈니스 로직(위치 동기화 및 API 호출)의 분리 필요
- `any` 타입 사용 제거 및 명시적 타입 정의로 타입 안정성 확보
- 코드 가독성 및 유지보수성 향상

### 변경 내용 요약
1. **Custom Hook 분리**: `useLocationSync` 훅을 생성하여 `LocationNav` 컴포넌트 내의 복잡한 `useEffect` 로직, 상태 관리, API 호출을 분리했습니다.
    - 위치 정보 동기화 (Backend API + Kakao Reverse Geocoding Fallback)
    - 구/동 목록 로드 및 상태 관리
2. **타입 정의 강화**: 
    - `geocoding.service.ts`에서 `any` 타입을 제거하고 `KakaoCoord2AddressResult` 등 명시적 인터페이스를 정의하여 사용했습니다.
    - `kakao.d.ts`에 `coord2Address` 메서드 타입을 추가했습니다.
3. **컴포넌트 구조 개선**:
    - `LocationNav.tsx`는 이제 UI 렌더링에만 집중하며, 데이터와 핸들러는 Hook으로부터 주입받습니다.
    - 내부 컴포넌트(`Separator`)를 `render` 함수 외부로 이동시켜 불필요한 재생성을 방지했습니다.
