'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronRight,
  LogOut,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ProfileImageCropModal } from './ProfileImageCropModal';
import { ImUser } from 'react-icons/im';

type SettingsGroup = {
  title: string;
  items: { label: string; icon: LucideIcon; onClick?: () => void }[];
};

type ProfilePopupProps = {
  nickname: string;
  onNicknameChange: (value: string) => void;
  onClose: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  logoutError: string | null;
  onOpenPreferences: () => void;
  onSaveProfile: () => void;
  isSavingProfile: boolean;
  profileError: string | null;
  profileImageKey?: string | null;
  onProfileImageChange: (key: string) => void;
  isSidebarOpen?: boolean;
};

export function ProfilePopup({
  nickname,
  onNicknameChange,
  onClose,
  onLogout,
  isLoggingOut,
  logoutError,
  onOpenPreferences,
  onSaveProfile,
  isSavingProfile,
  profileError,
  profileImageKey,
  onProfileImageChange,
  isSidebarOpen = true,
}: ProfilePopupProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const profileImageUrl = profileImageKey
    ? `${API_BASE_URL}/image/${encodeURIComponent(profileImageKey)}`
    : '';
  const popupPositionClass = isSidebarOpen
    ? 'bottom-24 left-4 w-[calc(320px-2rem)]'
    : 'bottom-20 left-4 w-[calc(320px-2rem)]';

  useEffect(() => {
    return () => {
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
      }
    };
  }, [selectedImageUrl]);

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
    }

    const url = URL.createObjectURL(file);
    setSelectedImageUrl(url);
    setSelectedFileName(file.name);
    setIsCropOpen(true);
  };

  const settingsGroups: SettingsGroup[] = [
    {
      title: 'Account',
      items: [
        {
          label: '창업 조건 설정',
          icon: SlidersHorizontal,
          onClick: onOpenPreferences,
        },
      ],
    },
  ];

  return (
    <>
      <motion.div
        key="profile-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <motion.div
        key="profile-popup"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className={`fixed z-50 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col ${popupPositionClass}`}
      >
        <div className="p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-background shadow-md bg-muted flex items-center justify-center">
                {profileImageKey ? (
                  <ImageWithFallback
                    src={profileImageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImUser className="w-full h-full text-muted-foreground p-3" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                aria-label="프로필 이미지 변경"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={nickname}
                onChange={(e) => onNicknameChange(e.target.value)}
                className="w-full text-h5 font-bold text-foreground bg-transparent border-none focus:ring-0 p-0"
                placeholder="닉네임 입력"
              />
              <button
                type="button"
                onClick={onSaveProfile}
                disabled={isSavingProfile || nickname.trim().length === 0}
                className="text-caption font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
              >
                {isSavingProfile ? '저장 중...' : '프로필 저장'}
              </button>
            </div>
          </div>
          {profileError && (
            <p className="mt-3 text-tiny text-destructive">{profileError}</p>
          )}
        </div>

        <div className="p-2">
          {settingsGroups.map((group) => (
            <div key={group.title} className="mb-2">
              <p className="px-3 py-2 text-tiny font-medium text-muted-foreground uppercase tracking-wider">
                {group.title}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary shadow-sm">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-caption font-strong text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="p-2 bg-muted/50 border-t border-border">
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-3 text-caption font-bold text-destructive hover:bg-background hover:shadow-sm rounded-xl transition-all disabled:opacity-60"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
          {logoutError && (
            <p className="px-2 pt-2 text-caption text-destructive">
              {logoutError}
            </p>
          )}
        </div>
      </motion.div>

      <ProfileImageCropModal
        isOpen={isCropOpen}
        imageUrl={selectedImageUrl}
        fileName={selectedFileName}
        onClose={() => {
          setIsCropOpen(false);
          setSelectedImageUrl(null);
          setSelectedFileName('');
        }}
        onReselect={() => fileInputRef.current?.click()}
        onComplete={(key) => {
          onProfileImageChange(key);
          setIsCropOpen(false);
          setSelectedImageUrl(null);
          setSelectedFileName('');
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelectFile}
      />
    </>
  );
}
