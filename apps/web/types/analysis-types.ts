export interface AnalysisData {
  meta: {
    yearQuarter: string;
    regionCode?: string;
  };
  sales: {
    total: string;
    trend: any[]; 
    dayOfWeek: any;
    timeOfDay: any;
    gender: any;
    age: any;
  };
  store: {
    total: number;
    categories: Array<{ name: string; count: number; open?: number; close?: number }>;
    openingRate?: number;
    closingRate?: number;
  };
  population: {
    total: number;
    male: number;
    female: number;
    age: any;
  } | null;
}

export interface AnalysisCardProps {
  title: string;
  address: string;
  estimatedSales: string;
  salesChange: string;
  storeCount: string;
  color?: string;
  onClose: () => void;
  onClear: () => void;
  hoveredTab?: string | null;
  onTabHover?: (tab: string | null) => void;
  activeTab?: 'sales' | 'store' | 'population';
  onTabChange?: (tab: 'sales' | 'store' | 'population') => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  regionCode?: string;
}
