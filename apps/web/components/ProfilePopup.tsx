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
  const fallbackImage =
    'https://images.unsplash.com/photo-1649433658557-54cf58577c68?q=80&w=200&h=200&auto=format&fit=crop';
  const profileImageUrl = profileImageKey
    ? `${API_BASE_URL}/image/${encodeURIComponent(profileImageKey)}`
    : fallbackImage;
  const popupPositionClass = isSidebarOpen
    ? 'bottom-24 left-6 w-[calc(350px-3rem)]'
    : 'bottom-20 left-6 w-[calc(350px-3rem)]';

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
        className={`fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col ${popupPositionClass}`}
      >
        <div className="p-6 border-b border-gray-50 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                <ImageWithFallback
                  src={profileImageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
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
                className="w-full text-h5 font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0"
                placeholder="닉네임 입력"
              />
              <button
                type="button"
                onClick={onSaveProfile}
                disabled={isSavingProfile || nickname.trim().length === 0}
                className="text-caption font-medium text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-60"
              >
                {isSavingProfile ? '저장 중...' : '프로필 저장'}
              </button>
            </div>
          </div>
          {profileError && (
            <p className="mt-3 text-tiny text-red-500">{profileError}</p>
          )}
        </div>

        <div className="p-2">
          {settingsGroups.map((group) => (
            <div key={group.title} className="mb-2">
              <p className="px-3 py-2 text-tiny font-medium text-slate-400 uppercase tracking-wider">
                {group.title}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-caption font-strong text-slate-700">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="p-2 bg-slate-50 border-t border-gray-100">
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-3 text-caption font-bold text-red-500 hover:bg-white hover:shadow-sm rounded-xl transition-all disabled:opacity-60"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
          {logoutError && (
            <p className="px-2 pt-2 text-caption text-red-500">{logoutError}</p>
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
