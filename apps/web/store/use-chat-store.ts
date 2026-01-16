"use client";

import { create } from "zustand";

type ChatState = {
  conversationId: string | null;
  setConversationId: (conversationId: string | null) => void;
  clearConversationId: () => void;
};

const STORAGE_KEY = "chat_conversation_id";

const readConversationId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
};

export const useChatStore = create<ChatState>((set) => ({
  conversationId: readConversationId(),
  setConversationId: (conversationId) => {
    if (typeof window !== "undefined") {
      if (conversationId) {
        localStorage.setItem(STORAGE_KEY, conversationId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    set({ conversationId });
  },
  clearConversationId: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ conversationId: null });
  },
}));
