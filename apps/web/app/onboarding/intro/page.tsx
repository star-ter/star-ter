'use client';

import { useRouter } from 'next/navigation';
import { OnboardingIntroPage } from '@/components/OnboardingIntroPage';

export default function Page() {
  const router = useRouter();
  return (
    <OnboardingIntroPage
      onStart={() => router.push('/onboarding')}
      onSkip={() => router.push('/locations')}
    />
  );
}
