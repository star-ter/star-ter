"use client";

import { Suspense } from "react";
import { ChatPage } from "@/components/chat/ChatPage";

/**
 * TODO: URL 퇴출 시 반드시 Suspense 제거하기
 *
 */
export default function ChatRoutePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPage />
    </Suspense>
  );
}
