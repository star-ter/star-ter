import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  width: number;
  toggleOpen: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setWidth: (width: number) => void;
  isResizing: boolean;
  setIsResizing: (isResizing: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  width: 400,
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (isOpen) => set({ isOpen }),
  setWidth: (width) => set({ width }),
  isResizing: false,
  setIsResizing: (isResizing) => set({ isResizing }),
}));
