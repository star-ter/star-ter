'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { regist } from '@/services/auth/auth.api';
import { AuthLayout } from './AuthLayout';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface RegisterPageProps {
  onRegister: () => void;
}

export function RegisterPage({ onRegister }: RegisterPageProps) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!email.includes('.com')) {
      setError('이메일 형식이 올바르지 않습니다. (.com)');
      return;
    }

    setIsSubmitting(true);
    try {
      await regist({ email, password, nickname });
      onRegister();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '회원가입에 실패했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center w-full">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-h1 font-heading mb-4 text-foreground tracking-tight">
            회원가입
          </h1>
          <p className="text-muted-foreground text-body font-medium">
            Alley 가입을 환영합니다!
          </p>
        </div>

        <form onSubmit={handleRegister} className="w-full space-y-5">
          <div className="space-y-4">
            {/* Nickname */}
            <div className="relative">
              <Input
                id="nickname"
                type="text"
                placeholder="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                className="h-12 border border-border bg-background rounded-xl px-4 pl-4 text-body placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring transition-all font-medium"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border border-border bg-background rounded-xl px-4 pl-4 text-body placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring transition-all font-medium"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border border-border bg-background rounded-xl px-4 pl-4 pr-12 text-body placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 border border-border bg-background rounded-xl px-4 pl-4 pr-12 text-body placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-md font-bold rounded-xl shadow-md shadow-muted transition-all hover:-translate-y-0.5"
            >
              {isSubmitting ? '가입 중...' : '회원가입'}
            </Button>
          </div>

          {error && (
            <p className="text-caption text-destructive text-center font-medium bg-destructive/10 py-2 rounded-lg">
              {error}
            </p>
          )}
        </form>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 my-8">
          <div className="h-[2px] flex-1 bg-muted"></div>
          <span className="text-caption font-strong text-muted-foreground uppercase tracking-wider">
            Or Sign up with
          </span>
          <div className="h-[2px] flex-1 bg-muted"></div>
        </div>

        {/* Social Login */}
        <div className="w-full grid grid-cols-1 gap-3">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 w-full h-12 bg-background border border-border rounded-xl hover:bg-muted transition-colors text-foreground font-bold text-body group shadow-sm hover:shadow"
          >
            <svg
              className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              />
            </svg>
            Google 계정으로 가입
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-caption font-medium text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link
              href="/login"
              className="text-foreground font-bold hover:underline ml-1"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
