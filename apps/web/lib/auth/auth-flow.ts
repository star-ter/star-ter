import type { LoginResponse } from '@/services/auth/auth.api.types';
export type AuthResult = Pick<
  LoginResponse,
  'id' | 'nickname' | 'on_boarding_completed' | 'profile_image_key'
>;

type RouterLike = {
  push: (path: string) => void;
  replace: (path: string) => void;
};

type AuthUserInput = {
  id?: string;
  nickname?: string;
  profileImageKey?: string | null;
};

type SetAuthUser = (user: AuthUserInput | null) => void;

export function normalizeNextPath(nextParam?: string | null) {
  if (!nextParam) return '/locations';
  if (!nextParam.startsWith('/')) return '/locations';
  if (nextParam.startsWith('/login')) return '/locations';
  return nextParam;
}

export function completeClientLogin(options: {
  result: AuthResult;
  setAuthUser: SetAuthUser;
  router: RouterLike;
  nextPath: string;
  replace?: boolean;
}) {
  const { result, setAuthUser, router, nextPath, replace = false } = options;
  setAuthUser({
    id: result.id,
    nickname: result.nickname,
    profileImageKey: result.profile_image_key ?? null,
  });
  const destination = result.on_boarding_completed
    ? nextPath
    : '/onboarding/intro';
  if (replace) {
    router.replace(destination);
    return;
  }
  router.push(destination);
}
