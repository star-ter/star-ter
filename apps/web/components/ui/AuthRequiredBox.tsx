'use client';

import Link from 'next/link';
import { Settings2, LogIn } from 'lucide-react';

export interface AuthRequiredBoxProps {
  /** 'login': 로그인 필요, 'onboarding': 창업 조건 설정 필요 */
  variant: 'login' | 'onboarding';
  /** 커스텀 제목 (미지정 시 variant에 따라 기본값 사용) */
  title?: string;
  /** 커스텀 설명 (미지정 시 variant에 따라 기본값 사용) */
  description?: string;
  /** 버튼 클릭 핸들러 (onboarding variant 시 필수) */
  onAction?: () => void;
  /** 커스텀 버튼 텍스트 (미지정 시 variant에 따라 기본값 사용) */
  actionLabel?: string;
  /** 추가 스타일 클래스 */
  className?: string;
}

const DEFAULT_CONTENT = {
  login: {
    title: '로그인이 필요합니다',
    description: '로그인하고 맞춤 서비스를 이용하세요.',
    actionLabel: '로그인하러 가기',
  },
  onboarding: {
    title: '창업 조건을 설정해주세요',
    description: '맞춤 상권 추천을 받으려면 창업 조건을 입력해야 합니다.',
    actionLabel: '창업 조건 설정하기',
  },
};

/**
 * 로그인 미완료 또는 온보딩 미완료 시 표시하는 안내 박스 컴포넌트
 */
export function AuthRequiredBox({
  variant,
  title,
  description,
  onAction,
  actionLabel,
  className = '',
}: AuthRequiredBoxProps) {
  const defaults = DEFAULT_CONTENT[variant];
  const displayTitle = title ?? defaults.title;
  const displayDescription = description ?? defaults.description;
  const displayActionLabel = actionLabel ?? defaults.actionLabel;

  const Icon = variant === 'login' ? LogIn : Settings2;

  return (
    <div
      className={`rounded-2xl p-8 border border-border flex flex-col items-center text-center bg-muted/30 ${className}`}
    >
      <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm border border-border">
        <Icon className={`w-8 h-8 text-muted-foreground ${variant === 'login' ? 'ml-1' : ''}`} />
      </div>
      <h3 className="text-h4 font-strong text-foreground mb-2">
        {displayTitle}
      </h3>
      <p className="text-body text-muted-foreground mb-6 max-w-sm">
        {displayDescription}
      </p>
      {variant === 'login' ? (
        <Link
          href="/auth/login"
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          {displayActionLabel}
        </Link>
      ) : (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
        >
          {displayActionLabel}
        </button>
      )}
    </div>
  );
}
