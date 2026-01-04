
import React, { useState, useRef } from 'react';
import AnalysisCard from './AnalysisCard';
import { useSidebarStore } from '@/stores/useSidebarStore';

interface ComparisonData {
  title: string;
  address: string;
  estimatedSales: string;
  salesChange: string;
  storeCount: string;
}

interface ComparisonOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  dataA: ComparisonData;
  dataB: ComparisonData;
}

export default function ComparisonOverlay({
  isVisible,
  onClose,
  dataA,
  dataB,
}: ComparisonOverlayProps) {
  const { isOpen, width, isResizing } = useSidebarStore();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sales' | 'store' | 'population'>('sales');
  const [isStoreExpanded, setIsStoreExpanded] = useState(false);

  const scrollRefA = useRef<HTMLDivElement>(null);
  const scrollRefB = useRef<HTMLDivElement>(null);
  const activeScrollRef = useRef<'A' | 'B' | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = (source: 'A' | 'B') => (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    
    if (activeScrollRef.current && activeScrollRef.current !== source) {
      return;
    }

    activeScrollRef.current = source;

    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
        activeScrollRef.current = null;
    }, 50);

    const other = source === 'A' ? scrollRefB.current : scrollRefA.current;

    if (other) {
       if (Math.abs(other.scrollTop - target.scrollTop) > 0) {
          other.scrollTop = target.scrollTop;
       }
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`absolute inset-0 z-50 flex items-center justify-center animate-fade-in p-4 overflow-visible ${
        isResizing ? '' : 'transition-all duration-300 ease-in-out'
      }`}
      style={{ paddingRight: isOpen ? `${width + 32}px` : '16px' }} 
    >
      
      <div className="relative flex flex-row gap-6 items-start justify-center flex-wrap">
        <button 
          onClick={onClose}
          className="absolute -top-3 -right-3 sm:-right-10 sm:-top-6 text-white bg-blue-500/50 hover:bg-blue-500 rounded-full p-2 shadow-lg transition-transform transform hover:scale-110 z-[60]"
          title="닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <AnalysisCard
          title={dataA.title}
          address={dataA.address}
          estimatedSales={dataA.estimatedSales}
          salesChange={dataA.salesChange}
          storeCount={dataA.storeCount}
          color="#4285F4"
          onClose={onClose}
          onClear={() => console.log('Clear A')}
          hoveredTab={hoveredTab}
          onTabHover={setHoveredTab}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          scrollRef={scrollRefA}
          onScroll={handleScroll('A')}
          isStoreExpanded={isStoreExpanded}
          onStoreExpand={setIsStoreExpanded}
        />
        <AnalysisCard
          title={dataB.title}
          address={dataB.address}
          estimatedSales={dataB.estimatedSales}
          salesChange={dataB.salesChange}
          storeCount={dataB.storeCount}
          color="#4285F4"
          onClose={onClose}
          onClear={() => console.log('Clear B')}
          hoveredTab={hoveredTab}
          onTabHover={setHoveredTab}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          scrollRef={scrollRefB}
          onScroll={handleScroll('B')}
          isStoreExpanded={isStoreExpanded}
          onStoreExpand={setIsStoreExpanded}
        />
      </div>
    </div>
  );
}
