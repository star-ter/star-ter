'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Sidebar } from './Sidebar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeMenu = useMemo(() => {
    if (!pathname) return 'home';
    if (pathname.includes('/chat')) return 'chat';
    if (pathname.includes('/locations/search')) return 'templates';
    if (pathname.includes('/locations/detail')) return 'meetings';
    return 'home';
  }, [pathname]);

  return (
    <div
      className="min-h-screen bg-[#f7f7f8] flex relative"
      style={
        {
          '--sidebar-offset': isSidebarOpen ? '350px' : '80px',
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
        isOpen={isSidebarOpen}
        onToggle={setIsSidebarOpen}
      />
      <div
        className={`flex-1 h-screen overflow-hidden transition-all duration-300 ease-in-out py-4 pr-4 bg-[#f7f7f8] ${
          isSidebarOpen ? 'ml-80' : 'ml-20'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
