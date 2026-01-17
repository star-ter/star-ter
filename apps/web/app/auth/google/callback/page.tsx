import { normalizeNextPath } from '@/lib/auth/auth-flow';
import { GoogleCallbackClient } from './GoogleCallbackClient';

type CallbackSearchParams = {
  next?: string | string[];
};

export default async function GoogleCallbackPage({
  searchParams,
}: {
  searchParams?: Promise<CallbackSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const nextParam = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0]
    : resolvedSearchParams.next;
  const nextPath = normalizeNextPath(nextParam);

  return <GoogleCallbackClient nextPath={nextPath} />;
}
