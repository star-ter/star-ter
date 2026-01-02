import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot() {
  return localStorage.getItem('accessToken');
}

function getServerSnapshot() {
  return null;
}

export function useAuth() {
  // React 18 공식 API: 외부 스토어(localStorage)와 동기화
  const token = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    isLoggedIn: !!token,
    loading: false, // useSyncExternalStore는 동기적으로 가져오므로 loading 불필요
  };
}
