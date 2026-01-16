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
import { StartupPreferencesPopup } from './StartupPreferencesPopup';
import {
  getPersonalization,
  updateOnboarding,
  updateProfile,
} from '@/services/user/user.api';
import { getChatConversations } from '@/services/chat/chat.api';
import type { OnboardingData } from './onboarding/onboarding-options';
import { Logo } from './landing/header/Logo';

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
const DEFAULT_PROFILE_IMAGE =
  'https://images.unsplash.com/photo-1649433658557-54cf58577c68?q=80&w=200&h=200&auto=format&fit=crop';
const LAYOUT_SWITCH_DELAY_MS = 180;

const getProfileImageUrl = (profileImageKey?: string | null) =>
  profileImageKey
    ? `${API_BASE_URL}/image/${encodeURIComponent(profileImageKey)}`
    : DEFAULT_PROFILE_IMAGE;

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
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showPreferencesPopup, setShowPreferencesPopup] = useState(false);
  const [nickname, setNickname] = useState(authUser?.nickname ?? '사용자');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [initialPreferences, setInitialPreferences] = useState<
    OnboardingData | undefined
  >();
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
      setShowPreferencesPopup(false);
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

  const handleOpenPreferences = () => {
    setShowProfilePopup(false);
    setPreferencesError(null);
    setShowPreferencesPopup(true);
    setIsLoadingPreferences(true);
    getPersonalization()
      .then((data) => {
        setInitialPreferences(data);
      })
      .catch((err) => {
        const message =
          err instanceof Error
            ? err.message
            : '개인화 정보 조회에 실패했습니다.';
        setPreferencesError(message);
      })
      .finally(() => {
        setIsLoadingPreferences(false);
      });
  };

  const handleSavePreferences = async (data: OnboardingData) => {
    setIsSavingPreferences(true);
    setPreferencesError(null);
    try {
      await updateOnboarding(data);
      setShowPreferencesPopup(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '설정 저장에 실패했습니다.';
      setPreferencesError(message);
    } finally {
      setIsSavingPreferences(false);
    }
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
  const sidebarHeaderClass = `h-16 flex items-center border-b border-gray-100 shrink-0 ${
    useCompactLayout ? 'justify-center' : 'px-6 justify-between'
  }`;

  return (
    <>
      <div className={sidebarContainerClass}>
        <div className="bg-white rounded-2xl shadow-lg h-full flex flex-col overflow-hidden">
          <header className={sidebarHeaderClass}>
            {!useCompactLayout && isOpen ? <Logo></Logo> : null}
            <button
              onClick={handleSidebarToggle}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
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
                <p className="px-4 text-tiny font-strong text-gray-400 mb-2">
                  메인 메뉴
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => onMenuClick('home')}
                    className={`w-full min-w-0 flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                      activeMenu === 'home'
                        ? 'bg-slate-50 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Home
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeMenu === 'home'
                          ? 'text-slate-900'
                          : 'text-slate-400'
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
                        ? 'bg-slate-50 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <FileText
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeMenu === 'templates'
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="min-w-0 truncate text-caption font-strong">
                      상권 찾기
                    </span>
                  </button>
                </div>

                {/* 구분선 */}
                <div className="my-4 border-t border-gray-200" />

                {/* AI 채팅 섹션 */}
                <div className="mb-3">
                  <p className="px-4 text-tiny font-strong text-gray-400 mb-2">
                    AI 분석
                  </p>
                  <button
                    onClick={() => {
                      clearConversationId();
                      onMenuClick('chat');
                    }}
                    className="w-full min-w-0 flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 bg-white border border-indigo-100 shadow-sm hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md transition-all group"
                  >
                    <MessageSquarePlus className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors" />
                    <span className="min-w-0 truncate text-caption font-strong">
                      New Chat
                    </span>
                  </button>
                </div>

                {/* 채팅 히스토리 */}
                <div className="space-y-1">
                  <p className="px-4 text-tiny font-strong text-gray-400 mb-2">
                    History
                  </p>
                  {isLoadingHistory ? (
                    <div className="px-4 py-2 text-tiny text-slate-400">
                      불러오는 중...
                    </div>
                  ) : historyError ? (
                    <div className="px-4 py-2 text-tiny text-rose-400">
                      {historyError}
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <div className="px-4 py-2 text-tiny text-slate-400">
                      대화 내역이 없습니다.
                    </div>
                  ) : (
                    chatHistory.map((item) => {
                      const label = item.title?.trim() ? item.title : '새 대화';
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setConversationId(item.id);
                            router.push('/chat');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors text-left"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate text-caption font-strong">
                            {label}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </nav>

              <footer className="px-4 py-2 border-t border-gray-100 bg-white">
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
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100">
                            <ImageWithFallback
                              src={getProfileImageUrl(
                                authUser?.profileImageKey,
                              )}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body font-strong text-slate-900 truncate">
                            {nickname}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => setShowProfilePopup((prev) => !prev)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
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
                      className="w-full min-w-0 flex items-center justify-between px-4 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className="truncate text-tiny font-bold">
                        로그인
                      </span>
                      <LogIn className="w-4 h-4 text-slate-400" />
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
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
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
                    className="relative rounded-full border border-gray-100"
                    aria-label="Open profile settings"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden">
                      <ImageWithFallback
                        src={getProfileImageUrl(authUser?.profileImageKey)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
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
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
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
                onOpenPreferences={handleOpenPreferences}
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
      {isMounted &&
        createPortal(
          <AnimatePresence>
            {showPreferencesPopup && (
              <StartupPreferencesPopup
                initialData={initialPreferences}
                onClose={() => setShowPreferencesPopup(false)}
                onSave={handleSavePreferences}
                isSaving={isSavingPreferences}
                isLoading={isLoadingPreferences}
                error={preferencesError}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
