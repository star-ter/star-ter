import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  isInfoBarOpen: boolean;
  width: number;
  toggleOpen: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setInfoBarOpen: (isOpen: boolean) => void;
  setWidth: (width: number) => void;
  isResizing: boolean;
  setIsResizing: (isResizing: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  isInfoBarOpen: false,
  width: 400,
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (isOpen) => set({ isOpen }),
  setInfoBarOpen: (isInfoBarOpen) => set({ isInfoBarOpen }),
  setWidth: (width) => set({ width }),
  isResizing: false,
  setIsResizing: (isResizing) => set({ isResizing }),
}));
