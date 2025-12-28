import { create } from 'zustand';

interface ComparisonData {
  title: string;
  address: string;
  estimatedSales: string;
  salesChange: string;
  storeCount: string;
}

interface ComparisonState {
  isVisible: boolean;
  dataA: ComparisonData | null;
  dataB: ComparisonData | null;
  openComparison: (dataA: ComparisonData, dataB: ComparisonData) => void;
  closeComparison: () => void;
}

export const useComparisonStore = create<ComparisonState>((set) => ({
  isVisible: false,
  dataA: null,
  dataB: null,
  openComparison: (dataA, dataB) => set({ isVisible: true, dataA, dataB }),
  closeComparison: () => set({ isVisible: false }),
}));
