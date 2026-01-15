'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { regist } from '@/services/auth/auth.api';
import { AuthLayout } from './AuthLayout';

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
    window.location.href = 'http://localhost:4000/auth/google';
  };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center w-full">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            회원가입
          </h1>
          <p className="text-slate-500 text-[15px] font-medium">
            지리응답 가입을 환영합니다!
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
                className="h-12 border border-slate-200 bg-white rounded-xl px-4 pl-4 text-[15px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500 transition-all font-medium"
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
                className="h-12 border border-slate-200 bg-white rounded-xl px-4 pl-4 text-[15px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500 transition-all font-medium"
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
                className="h-12 border border-slate-200 bg-white rounded-xl px-4 pl-4 pr-12 text-[15px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                className="h-12 border border-slate-200 bg-white rounded-xl px-4 pl-4 pr-12 text-[15px] placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:border-blue-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white text-[16px] font-bold rounded-xl shadow-md shadow-slate-200 transition-all hover:-translate-y-0.5"
            >
              {isSubmitting ? '가입 중...' : '회원가입'}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center font-medium bg-red-50 py-2 rounded-lg">
              {error}
            </p>
          )}
        </form>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 my-8">
          <div className="h-[2px] flex-1 bg-slate-100"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Or Sign up with
          </span>
          <div className="h-[2px] flex-1 bg-slate-100"></div>
        </div>

        {/* Social Login */}
        <div className="w-full grid grid-cols-1 gap-3">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 w-full h-12 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-700 font-bold text-[15px] group shadow-sm hover:shadow"
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
          <p className="text-sm font-medium text-slate-500">
            이미 계정이 있으신가요?{' '}
            <Link
              href="/login"
              className="text-slate-900 font-bold hover:underline ml-1"
            >
              로그인 하기
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
