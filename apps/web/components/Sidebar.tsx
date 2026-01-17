'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Home,
  FileText,
  MessageSquare,
  MessageSquarePlus,
  X,
  Settings,
  Menu,
  LogIn,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { logout } from '@/services/auth/auth.api';
import { useUserStore } from '@/store/use-user-store';
import { useChatStore } from '@/store/use-chat-store';
import { ProfilePopup } from './ProfilePopup';
import { updateProfile } from '@/services/user/user.api';
import {
  deleteConversation,
  getChatConversations,
  updateConversationTitle,
} from '@/services/chat/chat.api';
import { Logo } from './landing/header/Logo';
import { SidebarChatHistory } from './SidebarChatHistory';
import { ImUser } from 'react-icons/im';

interface SidebarProps {
  activeMenu: string;
  onMenuClick: (id: string) => void;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

const MENU_ITEMS = [
  { id: 'home', icon: Home, label: '홈' },
  { id: 'templates', icon: FileText, label: '상권 찾기' },
  { id: 'chat', icon: MessageSquare, label: 'AI 채팅' },
] as const;

type ChatHistoryItem = {
  id: string;
  title?: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const LAYOUT_SWITCH_DELAY_MS = 180;

const getProfileImageUrl = (profileImageKey: string) =>
  `${API_BASE_URL}/image/${encodeURIComponent(profileImageKey)}`;

export function Sidebar({
  activeMenu,
  onMenuClick,
  isOpen,
  onToggle,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const authUser = useUserStore((state) => state.authUser);
  const authUserId = authUser?.id;
  const clearAuthUser = useUserStore((state) => state.clearAuthUser);
  const setAuthUser = useUserStore((state) => state.setAuthUser);
  const setConversationId = useChatStore((state) => state.setConversationId);
  const clearConversationId = useChatStore(
    (state) => state.clearConversationId,
  );
  const currentConversationId = useChatStore((state) => state.conversationId);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [nickname, setNickname] = useState(authUser?.nickname ?? '사용자');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

  const [isMounted, setIsMounted] = useState(false);
  const layoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [useCompactLayout, setUseCompactLayout] = useState(!isOpen);

  useEffect(() => {
    setNickname(authUser?.nickname ?? '사용자');
  }, [authUser?.nickname]);

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (authUser) {
      setAuthUser({ ...authUser, nickname: value });
    }
  };

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
        layoutTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setShowProfilePopup(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!authUserId) {
      setChatHistory([]);
      return;
    }

    let isCancelled = false;
    setIsLoadingHistory(true);
    setHistoryError(null);

    getChatConversations()
      .then((conversations) => {
        if (!isCancelled) {
          setChatHistory(conversations);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          const message =
            err instanceof Error
              ? err.message
              : '대화 목록 조회에 실패했습니다.';
          setHistoryError(message);
          setChatHistory([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [authUserId, historyRefreshToken]);

  useEffect(() => {
    if (!authUserId) {
      return;
    }

    const handleRefresh = () => {
      setHistoryRefreshToken((prev) => prev + 1);
    };

    window.addEventListener('chat:updated', handleRefresh);
    return () => {
      window.removeEventListener('chat:updated', handleRefresh);
    };
  }, [authUserId]);

  useEffect(() => {
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
      layoutTimeoutRef.current = null;
    }

    if (isOpen) {
      setUseCompactLayout(false);
      return;
    }

    layoutTimeoutRef.current = setTimeout(() => {
      setUseCompactLayout(true);
      layoutTimeoutRef.current = null;
    }, LAYOUT_SWITCH_DELAY_MS);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      clearAuthUser();
      clearConversationId();
      setChatHistory([]);
      setShowProfilePopup(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '로그아웃에 실패했습니다.';
      setLogoutError(message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!authUserId) {
      throw new Error('로그인이 필요합니다.');
    }
    await deleteConversation(conversationId);
    setChatHistory((prev) => prev.filter((item) => item.id !== conversationId));
    if (currentConversationId === conversationId) {
      clearConversationId();
    }
  };

  const handleUpdateConversationTitle = async (
    conversationId: string,
    title: string,
  ) => {
    if (!authUserId) {
      throw new Error('로그인이 필요합니다.');
    }
    const updated = await updateConversationTitle(conversationId, title);
    setChatHistory((prev) =>
      prev.map((item) =>
        item.id === updated.id
          ? { ...item, title: updated.title ?? title }
          : item,
      ),
    );
  };



  const handleSaveProfile = async () => {
    if (!authUser) return;
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const response = await updateProfile({ nickname });
      setAuthUser({
        ...authUser,
        nickname: response.nickname ?? nickname,
        profileImageKey: response.profile_image_key ?? authUser.profileImageKey,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '프로필 저장에 실패했습니다.';
      setProfileError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProfileImageChange = (key: string) => {
    if (!authUser) return;
    setAuthUser({ ...authUser, profileImageKey: key });
  };

  const handleSidebarToggle = () => {
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
      layoutTimeoutRef.current = null;
    }
    onToggle(!isOpen);
  };

  const sidebarContainerClass = `fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out ${
    isOpen ? 'w-[320px] p-4' : 'w-20 px-3 py-4'
  }`;
  const sidebarHeaderClass = `h-16 flex items-center border-b border-border shrink-0 ${
    useCompactLayout ? 'justify-center' : 'px-6 justify-between'
  }`;

  return (
    <>
      <div className={sidebarContainerClass}>
        <div className="bg-background rounded-2xl shadow-lg h-full flex flex-col overflow-hidden border border-border">
          <header className={sidebarHeaderClass}>
            {!useCompactLayout && isOpen ? <Logo width={72}></Logo> : null}
            <button
              onClick={handleSidebarToggle}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </header>

          {!useCompactLayout ? (
            <div
              className={`flex flex-col flex-1 ${isOpen ? '' : 'pointer-events-none'}`}
            >
              <nav className="flex-1 px-4 py-3 overflow-y-auto no-scrollbar">
                {/* 메인 네비게이션 */}
                <p className="px-4 text-tiny font-strong text-muted-foreground mb-2">
                  메인 메뉴
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => onMenuClick('home')}
                    className={`w-full min-w-0 flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                      activeMenu === 'home'
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Home
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeMenu === 'home'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <span className="min-w-0 truncate text-caption font-strong">
                      홈
                    </span>
                  </button>
                  <button
                    onClick={() => onMenuClick('templates')}
                    className={`w-full min-w-0 flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                      activeMenu === 'templates'
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <FileText
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeMenu === 'templates'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <span className="min-w-0 truncate text-caption font-strong">
                      상권 찾기
                    </span>
                  </button>
                </div>

                {/* 구분선 */}
                <div className="my-4 border-t border-border" />

                {/* AI 채팅 섹션 */}
                <div className="mb-3">
                  <p className="px-4 text-tiny font-strong text-muted-foreground mb-2">
                    AI 분석
                  </p>
                  <button
                    onClick={() => {
                      clearConversationId();
                      onMenuClick('chat');
                    }}
                    className="w-full min-w-0 flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground bg-background border border-primary/20 shadow-sm hover:bg-primary/5 hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <MessageSquarePlus className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="min-w-0 truncate text-caption font-strong">
                      New Chat
                    </span>
                  </button>
                </div>

                <SidebarChatHistory
                  items={chatHistory}
                  isLoading={isLoadingHistory}
                  error={historyError}
                  onSelect={(conversationId) => {
                    setConversationId(conversationId);
                    router.push('/chat');
                  }}
                  onDelete={handleDeleteConversation}
                  onUpdateTitle={handleUpdateConversationTitle}
                  onError={setHistoryError}
                />
              </nav>

              <footer className="px-4 py-2 border-t border-border bg-background">
                <div className="flex items-center gap-3 px-2 py-2">
                  {authUser ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowProfilePopup((prev) => !prev)}
                        className="flex-1 min-w-0 flex items-center gap-3 text-left"
                        aria-label="Open profile settings"
                      >
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                            {authUser?.profileImageKey ? (
                              <ImageWithFallback
                                src={getProfileImageUrl(
                                  authUser.profileImageKey,
                                )}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImUser className="w-full h-full text-muted-foreground p-1.5" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body font-strong text-foreground truncate">
                            {nickname}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => setShowProfilePopup((prev) => !prev)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                        aria-label="Settings"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const next = pathname
                          ? `?next=${encodeURIComponent(pathname)}`
                          : '';
                        router.push(`/login${next}`);
                      }}
                      className="w-full min-w-0 flex items-center justify-between px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <span className="truncate text-caption font-bold">
                        로그인
                      </span>
                      <LogIn className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </footer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col px-2 py-3">
              <div className="flex flex-col items-center gap-2">
                {MENU_ITEMS.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => onMenuClick(id)}
                    className={`p-2 rounded-lg transition-colors ${
                      activeMenu === id
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    aria-label={label}
                    title={label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>

              <div className="mt-auto flex flex-col items-center gap-2 pb-2">
                {authUser ? (
                  <button
                    type="button"
                    onClick={() => setShowProfilePopup((prev) => !prev)}
                    className="relative rounded-full border border-border"
                    aria-label="Open profile settings"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {authUser?.profileImageKey ? (
                        <ImageWithFallback
                          src={getProfileImageUrl(authUser.profileImageKey)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImUser className="w-full h-full text-muted-foreground p-1.5" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-background rounded-full" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const next = pathname
                        ? `?next=${encodeURIComponent(pathname)}`
                        : '';
                      router.push(`/login${next}`);
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Login"
                    title="로그인"
                  >
                    <LogIn className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isMounted &&
        createPortal(
          <AnimatePresence>
            {showProfilePopup && (
              <ProfilePopup
                nickname={nickname}
                onNicknameChange={handleNicknameChange}
                onClose={() => setShowProfilePopup(false)}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
                logoutError={logoutError}
                isSavingProfile={isSavingProfile}
                profileError={profileError}
                onSaveProfile={handleSaveProfile}
                profileImageKey={authUser?.profileImageKey}
                onProfileImageChange={handleProfileImageChange}
                isSidebarOpen={isOpen}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}

    </>
  );
}
