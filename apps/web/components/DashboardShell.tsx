'use client';

import { useSidebarStore } from '@/store/use-sidebar-store';
import { useMemo, useState, useEffect, type CSSProperties } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Sidebar } from './Sidebar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useSidebarStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 사이드바를 숨길 경로 목록
  const isExcludedPage = useMemo(() => {
    if (!pathname) return false;
    const excludedPrefixes = ['/onboarding', '/login', '/regist', '/test'];
    // 정확히 일치하거나 하위 경로인 경우 제외
    return excludedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  }, [pathname]);

  // Hydration mismatch 방지: 마운트 전에는 아무것도 렌더링하지 않거나(깜빡임) 기본 로딩 상태 보여줌
  // 여기서는 구조상 children까지 안보이면 안되므로, 스타일 변수만 제어하거나
  // Sidebar 컴포넌트 내부적으로 처리하는 것이 좋음.
  // 다만 isSidebarOpen 값이 서버(true)와 클라이언트(false)가 다를 때 에러가 발생하므로
  // 마운트 전에는 true(기본값)를 강제하는 방식을 사용.
  const sidebarOpenState = isMounted ? isSidebarOpen : true;

  const activeMenu = useMemo(() => {
    if (!pathname) return 'home';
    if (pathname.includes('/chat')) return 'chat';
    if (pathname.includes('/locations/search')) return 'templates';
    if (pathname.includes('/locations/detail')) return 'meetings';
    return 'home';
  }, [pathname]);

  if (isExcludedPage) {
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex relative text-slate-800">
        <main className="flex-1 w-full h-full">{children}</main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f7f7f8] flex relative"
      style={
        {
          '--sidebar-offset': sidebarOpenState ? '350px' : '80px',
        } as CSSProperties
      }
    >
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={(id) => {
          if (id === 'home') router.push('/locations');
          if (id === 'templates') router.push('/locations/search');
          if (id === 'meetings') router.push('/locations/detail');
          if (id === 'chat') router.push('/chat');
        }}
        isOpen={sidebarOpenState}
        onToggle={setSidebarOpen}
      />
      <div
        className={`flex-1 h-screen overflow-hidden transition-all duration-300 ease-in-out py-4 pr-4 bg-[#f7f7f8] ${
          sidebarOpenState ? 'ml-80' : 'ml-20'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
