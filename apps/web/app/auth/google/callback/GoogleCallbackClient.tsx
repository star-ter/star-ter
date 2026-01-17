'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AuthLayout } from '@/components/AuthLayout';
import { getProfile } from '@/services/auth/auth.api';
import { completeClientLogin } from '@/lib/auth/auth-flow';
import { useUserStore } from '@/store/use-user-store';

type GoogleCallbackClientProps = {
  nextPath: string;
};

export function GoogleCallbackClient({ nextPath }: GoogleCallbackClientProps) {
  const router = useRouter();
  const setAuthUser = useUserStore((state) => state.setAuthUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (!cancelled) {
          completeClientLogin({
            result: profile,
            setAuthUser,
            router,
            nextPath,
            replace: true,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : '로그인에 실패했습니다.';
          setError(message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [setAuthUser, router, nextPath]);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-h2 font-heading text-slate-900">
          로그인 처리 중...
        </h1>
        {error ? (
          <>
            <p className="text-caption text-red-500 font-medium bg-red-50 py-2 px-4 rounded-lg">
              {error}
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              className="text-slate-900 font-bold hover:underline"
            >
              로그인 페이지로 돌아가기
            </Link>
          </>
        ) : (
          <p className="text-caption text-slate-500 font-medium">
            잠시만 기다려주세요.
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
