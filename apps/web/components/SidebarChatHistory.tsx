'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';

type ChatHistoryItem = {
  id: string;
  title?: string | null;
};

type SidebarChatHistoryProps = {
  items: ChatHistoryItem[];
  isLoading: boolean;
  error: string | null;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => Promise<void>;
  onUpdateTitle: (conversationId: string, title: string) => Promise<void>;
  onError: (message: string | null) => void;
};

const CLICK_DELAY_MS = 250;

export function SidebarChatHistory({
  items,
  isLoading,
  error,
  onSelect,
  onDelete,
  onUpdateTitle,
  onError,
}: SidebarChatHistoryProps) {
  const [deletingConversationId, setDeletingConversationId] = useState<
    string | null
  >(null);
  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
    };
  }, []);

  const handleHistoryItemClick = (conversationId: string) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    clickTimeoutRef.current = setTimeout(() => {
      onSelect(conversationId);
      clickTimeoutRef.current = null;
    }, CLICK_DELAY_MS);
  };

  const handleHistoryItemDoubleClick = (item: ChatHistoryItem) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    onError(null);
    setEditingConversationId(item.id);
    setEditingTitle(item.title?.trim() ? item.title : '새 대화');
  };

  const handleSaveConversationTitle = async () => {
    if (!editingConversationId || isSavingTitle) return;
    const trimmedTitle = editingTitle.trim();
    if (!trimmedTitle) {
      onError('제목을 입력해주세요.');
      return;
    }
    if (trimmedTitle.length > 50) {
      onError('제목은 50자 이하로 입력해주세요.');
      return;
    }
    setIsSavingTitle(true);
    onError(null);
    try {
      await onUpdateTitle(editingConversationId, trimmedTitle);
      setEditingConversationId(null);
      setEditingTitle('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '대화 제목 수정에 실패했습니다.';
      onError(message);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleCancelConversationTitle = () => {
    setEditingConversationId(null);
    setEditingTitle('');
    onError(null);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (deletingConversationId) return;
    setDeletingConversationId(conversationId);
    onError(null);
    try {
      await onDelete(conversationId);
      if (editingConversationId === conversationId) {
        setEditingConversationId(null);
        setEditingTitle('');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '대화 삭제에 실패했습니다.';
      onError(message);
    } finally {
      setDeletingConversationId(null);
    }
  };

  return (
    <div className="space-y-1">
      <p className="px-4 text-tiny font-strong text-muted-foreground mb-2">
        History
      </p>
      {isLoading ? (
        <div className="px-4 py-2 text-tiny text-muted-foreground">
          불러오는 중...
        </div>
      ) : error ? (
        <div className="px-4 py-2 text-tiny text-destructive">{error}</div>
      ) : items.length === 0 ? (
        <div className="px-4 py-2 text-tiny text-muted-foreground">
          대화 내역이 없습니다.
        </div>
      ) : (
        items.map((item) => {
          const label = item.title?.trim() ? item.title : '새 대화';
          const isDeleting = deletingConversationId === item.id;
          const isEditing = editingConversationId === item.id;
          return (
            <div
              key={item.id}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {isEditing ? (
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <input
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    onBlur={handleSaveConversationTitle}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSaveConversationTitle();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        handleCancelConversationTitle();
                      }
                    }}
                    maxLength={50}
                    autoFocus
                    className="w-full min-w-0 bg-transparent border-b border-border focus:outline-none focus:border-ring text-caption font-strong text-foreground"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleHistoryItemClick(item.id)}
                  onDoubleClick={() => handleHistoryItemDoubleClick(item)}
                  className="flex-1 min-w-0 flex items-center gap-3 text-left"
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-caption font-strong">
                    {label}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteConversation(item.id);
                }}
                disabled={isDeleting || isEditing}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="대화 삭제"
                title="삭제"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
