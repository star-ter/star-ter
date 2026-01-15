"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { OnboardingIntroPage } from "@/components/OnboardingIntroPage";
import { useUserStore } from "@/store/use-user-store";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuthUser = useUserStore((state) => state.setAuthUser);

  useEffect(() => {
    // Google OAuth 콜백에서 전달된 사용자 정보 처리
    const userId = searchParams.get("userId");
    const nickname = searchParams.get("nickname");

    if (userId && nickname) {
      setAuthUser({ id: userId, nickname });
      // URL에서 쿼리 파라미터 제거 (깔끔한 URL 유지)
      router.replace("/onboarding/intro");
    }
  }, [searchParams, setAuthUser, router]);

  return (
    <OnboardingIntroPage
      onStart={() => router.push("/onboarding")}
      onBack={() => router.push("/login")}
    />
  );
}

