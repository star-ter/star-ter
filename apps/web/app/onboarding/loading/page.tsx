'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRecommendStore } from '@/store/use-recommend-store';
import { getRecommendations } from '@/services/location/locationRecommend.service';
import { getOnboarding } from '@/services/user/user.api';
import authBg from '@/components/img/auth_bg.png';

export default function LoadingPage() {
  const router = useRouter();
  const setRecommendResult = useRecommendStore(
    (state) => state.setRecommendResult,
  );
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 프로그레스 애니메이션 (1초 동안 0 -> 100%)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 20);

    const fetchAndNavigate = async () => {
      try {
        // 실제 온보딩 데이터 가져오기
        const onboarding = await getOnboarding();

        if (!onboarding || !onboarding.completed) {
          router.push('/onboarding');
          return;
        }

        const [result] = await Promise.all([
          getRecommendations({
            age: onboarding.age || '20s',
            region: onboarding.region || 'commercial',
            operatingTime: onboarding.operatingTime || 'allday',
            capital: onboarding.capital || '50M',
            industryCode: onboarding.industryCode,
          }),
          new Promise((resolve) => setTimeout(resolve, 1000)),
        ]);

        // 결과를 스토어에 저장
        setRecommendResult(result);

        // 페이드 아웃 효과 후 메인 페이지로 이동
        setIsExiting(true);
        setTimeout(() => {
          router.push('/locations');
        }, 600);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        setIsExiting(true);
        setTimeout(() => {
          router.push('/locations');
        }, 600);
      }
    };

    fetchAndNavigate();

    return () => clearInterval(progressInterval);
  }, [router, setRecommendResult]);

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans transition-opacity duration-700 ease-in-out ${isExiting ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${authBg.src})`,
          filter: 'blur(4px) brightness(0.9)',
        }}
      />
      <div className="absolute inset-0 z-10 bg-white/30 backdrop-blur-[2px]" />

      {/* Main Content (No Card) */}
      <div className="relative z-20 w-full max-w-md mx-4 flex flex-col items-center">
        {/* Circular Spinner Area */}
        <div className="mb-12 relative">
          <div className="w-20 h-20 border-4 border-slate-200/30 rounded-full" />
          <div
            className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-[#2C2F6C] rounded-full animate-spin"
            style={{ borderTopColor: '#2C2F6C' }}
          />
        </div>

        {/* Main Text Area */}
        <div className="text-center mb-10 space-y-4">
          <h1 className="text-h2 font-bold text-slate-900 tracking-tight">
            맞춤 추천을 준비하고 있습니다
          </h1>
          <p className="text-slate-600 text-h5 font-medium leading-relaxed">
            입력하신 정보를 바탕으로 최적의 상권을 분석하고 있어요
          </p>
        </div>

        {/* Horizontal Progress System */}
        <div className="w-full max-w-xs space-y-8">
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2C2F6C] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%`, backgroundColor: '#2C2F6C' }}
            />
          </div>

          {/* Status Loading Text */}
          <p className="text-body font-bold text-slate-600 text-center animate-pulse tracking-widest">
            {progress < 30 && '데이터 수집 중 . . .'}
            {progress >= 30 && progress < 60 && '매출 패턴 분석 중 . . .'}
            {progress >= 60 && progress < 90 && '경쟁 현황 파악 중 . . .'}
            {progress >= 90 && '거의 다 됐어요!'}
          </p>
        </div>

        {/* Meta Percentage Text */}
        <div className="mt-4">
          <span className="text-caption font-bold text-slate-500 tabular-nums">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
