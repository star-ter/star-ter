# AI Chat Box UI 구현 계획

## 1. 개요
우측 사이드바 형태의 'AI Coach' 채팅 인터페이스를 구현합니다.
사용자는 이 인터페이스를 통해 매출 요약, 업종 추천, 운영 전략 등 다양한 AI 분석 기능을 대화형으로 이용할 수 있습니다.

## 2. UI/UX 디자인 분석 (이미지 기반)

### 2.1 레이아웃 (Layout)
- **위치**: 화면 우측 고정 (Fixed Right Sidebar)
- **크기**: 약 350px ~ 400px 너비, 전체 높이(100vh)
- **배경**: 밝은 회색 계열 (Background Light Gray)

### 2.2 구성 요소 (Components)

#### A. 헤더 (Header)
- **아이콘**: ✨ (Sparkle Icon) - AI의 인텔리전스를 상징
- **타이틀**: "AI Coach" 텍스트
- **스타일**: 심플하고 깔끔한 상단 바

#### B. 메인 콘텐츠 (Main Content / Scrollable)
- **인사말 (Greeting)**:
  - "AI Coach" 로고
  - "안녕하세요, 사장님 무엇을 도와드릴까요?" (메인 텍스트)
- **추천 질문 카드 (Suggestion Chips)**:
  - 카드 형태의 추천 질문 리스트
  - **구성**: 아이콘 + 제목 + 상세 설명 (파란색 하이라이트 텍스트 포함)
  - **예시 항목**:
    1. **매출 요약**: "이 입지에서 **치킨집**의 평균 매출을 요약해서 정리해줘"
    2. **업종 / 메뉴 추천**: "이 상권에서 **잘 맞는 업종 5개**를 추천하고, 체인점 설명해줘"
    3. **시간대 / 운영 전략**: "이 상권은 **점심 장사형**이야, **저녁 장사형**이야?"
    4. **상권 비교**: "**서울대입구역**과 사당역 상권을 비교하고, 서로의 장단점을 설명해줘"

#### C. 입력창 (Input Area)
- **위치**: 하단 고정
- **구성**:
  - 텍스트 입력 필드 ("AI Coach에 메시지 보내기")
  - 전송 버튼 ("질문하기" - 검정 배경, 흰 글씨)

## 3. 기술 스택 (Tech Stack) - Latest Next.js & React 19
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19 (RC/Canary Features)
  - **Server Actions**: 데이터 뮤테이션 및 폼 처리에 활용
  - **React Server Components (RSC)**: 기본 렌더링 방식
  - **New Hooks**: `useActionState` (폼 상태 관리), `useOptimistic` (낙관적 UI 업데이트)
- **Styling**: Tailwind CSS v4 (Oxide engine, CSS variables)
- **State Management**: React 19 Native Hooks (별도 라이브러리 최소화)
- **Iconography**: Lucide React

## 4. 단계별 구현 계획 (Implementation Steps)

### Step 1: 기본 구조 및 Server Component 설정 (Scaffolding)
- **Layout**: `apps/web/src/components/layout/AIChatLayout.tsx` (RSC)
  - 전체 레이아웃(`fixed`, `right-0`)을 잡는 서버 컴포넌트
- **Sidebar Container**: `apps/web/src/components/features/chat/AIChatSidebar.tsx` (Client Component)
  - 인터랙션이 필요한 부분만 클라이언트 컴포넌트로 분리 (`"use client"`)

### Step 2: UI 컴포넌트 퍼블리싱 (Publishing with Tailwind v4)
- **Tailwind v4 기능 활용**:
  - `apps/web/src/app/globals.css`에 정의된 최신 테마 변수 활용
- **Header & Greeting (RSC)**: 정적인 콘텐츠는 서버 컴포넌트로 렌더링하여 최적화
- **Suggestion Cards**:
  - 리스트 맵핑 및 스타일링
- **Input Area**:
  - React 19 `<form>` 요소 활용 준비

### Step 3: 최신 Next.js/React 패턴 적용 (Logic & Interaction)
- **Server Actions**:
  - `apps/web/src/actions/chat.ts`: 채팅 메시지 전송 로직을 Server Action으로 정의 (Mocking)
- **React 19 Hooks**:
  - **`useActionState`**: 채팅 전송 상태(pending, error, success) 관리
  - **`useOptimistic`**: 네트워크 응답 전 사용자에게 즉시 메시지 표시 (UX 향상)
- **Form Handling**:
  - `<form action={sendMessageAction}>` 패턴 사용

### Step 4: 반응형 및 디테일 (Polish)
- 모바일/데스크탑 반응형 처리
- 스트리밍 UI 처리 (Suspense or Streaming text effect)

## 5. 예상 파일 구조
```
apps/web/
  └── src/
      └── components/
          └── features/
              ├── AIChatSidebar.tsx      # 메인 사이드바 컴포넌트
              ├── ChatSuggestionCard.tsx # 추천 질문 카드 컴포넌트
              └── ChatInput.tsx          # 채팅 입력창 컴포넌트
```
