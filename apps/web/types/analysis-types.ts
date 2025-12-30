export interface SalesTrendItem {
  period: string;
  quarter?: string;
  sales: number;
}

export interface DayOfWeekSalesItem {
  day: string;
  sales: number;
  percentage: number;
}

export interface TimeOfDaySalesItem {
  time: string;
  sales: number;
  percentage: number;
}

export interface GenderSalesItem {
    male: number;
    female: number;
}

export interface AgeSalesItem {
    [key: string]: number;
}

export interface StoreCategoryItem {
    name: string;
    count: number;
    open?: number;
    close?: number;
}

export interface PopulationAgeItem {
  [key: string]: number;
}

export interface PopulationData {
  total: number;
  male: number;
  female: number;
  age: PopulationAgeItem;
}

export interface AnalysisData {
  meta: {
    yearQuarter: string;
    regionCode?: string;
  };
  sales: {
    total: string;
    trend: SalesTrendItem[];
    dayOfWeek: DayOfWeekSalesItem[];
    timeOfDay: TimeOfDaySalesItem[];
    gender: GenderSalesItem;
    age: AgeSalesItem;
  };
  store: {
    total: number;
    categories: StoreCategoryItem[];
    openingRate?: number;
    closingRate?: number;
  };
  population: {
    total: number;
    male: number;
    female: number;
    age: PopulationAgeItem;
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
  isStoreExpanded?: boolean;
  onStoreExpand?: (expanded: boolean) => void;
}
