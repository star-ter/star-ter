import { create } from 'zustand';
import { InfoBarData } from '../types/map-types';

interface SidebarState {
  isOpen: boolean;
  isInfoBarOpen: boolean;
  width: number;
  selectedArea: InfoBarData | null;
  isResizing: boolean;

  toggleOpen: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setInfoBarOpen: (isOpen: boolean) => void;
  setWidth: (width: number) => void;
  setIsResizing: (isResizing: boolean) => void;
  setSelectedArea: (data: InfoBarData | null) => void;
  selectArea: (data: InfoBarData) => void;
  clearSelection: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  isInfoBarOpen: false,
  width: 400,
  selectedArea: null,
  isResizing: false,

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (isOpen) => set({ isOpen }),
  setInfoBarOpen: (isInfoBarOpen) => set({ isInfoBarOpen }),
  setWidth: (width) => set({ width }),
  setIsResizing: (isResizing) => set({ isResizing }),
  setSelectedArea: (selectedArea) => set({ selectedArea }),
  selectArea: (data) => set({ selectedArea: data, isInfoBarOpen: true }),
  clearSelection: () => set({ selectedArea: null }),
}));
