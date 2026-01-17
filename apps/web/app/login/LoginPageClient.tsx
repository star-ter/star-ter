"use client";

import { useRouter } from "next/navigation";

import { LoginPage } from "@/components/LoginPage";
import { completeClientLogin } from "@/lib/auth/auth-flow";
import { useUserStore } from "@/store/use-user-store";

type LoginPageClientProps = {
  nextPath: string;
};

export function LoginPageClient({ nextPath }: LoginPageClientProps) {
  const router = useRouter();
  const setAuthUser = useUserStore((state) => state.setAuthUser);

  return (
    <LoginPage
      onLogin={(result) => {
        completeClientLogin({ result, setAuthUser, router, nextPath });
      }}
    />
  );
}
