'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';

export default function UserPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<{
    nickname: string;
    email: string;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (res.status === 401) {
          toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
          handleLogout();
          return;
        }

        if (!res.ok) throw new Error('Failed to fetch profile');

        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error(error);
        toast.error('회원 정보를 불러오지 못했습니다.');
      }
    };

    if (mounted && isLoggedIn) {
      fetchProfile();
    } else if (mounted && !isLoggedIn) {
      toast.error('로그인이 필요합니다.');
      router.push('/login');
    }
  }, [mounted, isLoggedIn, router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    toast.success('로그아웃 되었습니다.');
    window.location.href = '/';
  };

  if (!mounted || !isLoggedIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">지도로 돌아가기</span>
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-gray-200">
          {profile ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-blue-600" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.nickname}님, 환영합니다! 👋
                </h1>
                <p className="text-gray-500 mt-1">{profile.email}</p>
                <p className="text-xs text-gray-400 mt-2">
                  가입일: {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          )}

          <div className="mt-8 border-t border-gray-100 pt-8">
            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 hover:bg-red-100 transition-colors font-medium"
              >
                <LogOut className="h-5 w-5" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
