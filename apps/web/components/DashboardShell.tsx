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

  // Hydration mismatch 방지: 첫 렌더링 시에는 서버와 동일하게(기본값) 렌더링하거나 숨김 처리
  // 여기서는 isSidebarOpen 기본값이 true이므로, 마운트 전에는 true(기본값)를 유지하거나
  // 깜빡임을 줄이기 위해 마운트 된 후에만 스토어 값을 사용하도록 처리할 수 있음.
  // 다만 간단하게 구현하기 위해 바로 사용하되, 만약 레이아웃이 깨지면 isMounted 체크를 더 적극적으로 활용.
  // Sidebar 컴포넌트 내부적으로도 isMounted 체크가 있으므로 큰 문제는 없을 것으로 예상됨.

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
