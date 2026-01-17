'use client';

import { useRouter } from 'next/navigation';

import { OnboardingPage } from '@/components/OnboardingPage';
import type { OnboardingData } from '@/components/onboarding/onboarding-options';
import { updateOnboarding } from '@/services/user/user.api';

export default function Page() {
  const router = useRouter();
  return (
    <OnboardingPage
      onComplete={async (data: OnboardingData) => {
        await updateOnboarding(data);
        router.push('/onboarding/loading');
      }}
      onBack={() => router.push('/onboarding/intro')}
      onSkip={async (data) => {
        try {
          await updateOnboarding(data);
        } catch {
          // 건너뛰기 시 데이터가 불완전하여 저장이 실패할 수 있음 (무시하고 이동)
        }
        router.push('/locations');
      }}
    />
  );
}
