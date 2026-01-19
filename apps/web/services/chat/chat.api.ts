import type { AiAction, SourceInfo } from "@/lib/api/ai";

type ChatConversation = {
  id: string;
  title?: string | null;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type ErrorResponse = {
  message?: string;
};

export async function getChatConversations(): Promise<ChatConversation[]> {
  const response = await fetch(`${baseUrl}/chat/conversations`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    try {
      const errorData = (await response.json()) as ErrorResponse;
      throw new Error(errorData?.message || "대화 목록 조회에 실패했습니다.");
    } catch {
      throw new Error("대화 목록 조회에 실패했습니다.");
    }
  }

  return response.json() as Promise<ChatConversation[]>;
}

type ChatHistoryMetadata = {
  actions?: AiAction[];
  sources?: SourceInfo[];
  markers?: unknown[];
  streamAborted?: boolean;
};

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
  metadata?: ChatHistoryMetadata | null;
};

export async function getConversationHistory(
  conversationId: string,
): Promise<ChatHistoryMessage[]> {
  const response = await fetch(
    `${baseUrl}/chat/conversation/history/${encodeURIComponent(conversationId)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    try {
      const errorData = (await response.json()) as ErrorResponse;
      throw new Error(errorData?.message || "대화 기록 조회에 실패했습니다.");
    } catch {
      throw new Error("대화 기록 조회에 실패했습니다.");
    }
  }

  return response.json() as Promise<ChatHistoryMessage[]>;
}

export async function deleteConversation(
  conversationId: string,
): Promise<{ id: string }> {
  const response = await fetch(
    `${baseUrl}/chat/conversation/${encodeURIComponent(conversationId)}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  if (!response.ok) {
    try {
      const errorData = (await response.json()) as ErrorResponse;
      throw new Error(errorData?.message || "대화 삭제에 실패했습니다.");
    } catch {
      throw new Error("대화 삭제에 실패했습니다.");
    }
  }

  return response.json() as Promise<{ id: string }>;
}

export async function updateConversationTitle(
  conversationId: string,
  title: string,
): Promise<{ id: string; title?: string | null }> {
  const response = await fetch(
    `${baseUrl}/chat/conversation/${encodeURIComponent(conversationId)}/title`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    },
  );

  if (!response.ok) {
    try {
      const errorData = (await response.json()) as ErrorResponse;
      throw new Error(errorData?.message || "대화 제목 수정에 실패했습니다.");
    } catch {
      throw new Error("대화 제목 수정에 실패했습니다.");
    }
  }

  return response.json() as Promise<{ id: string; title?: string | null }>;
}
