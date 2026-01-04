import { create } from 'zustand';
import { ReactNode } from 'react';

type ModalType = 'alert' | 'confirm' | 'custom';

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title?: string;
  content?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  openModal: (params: {
    type: ModalType;
    title?: string;
    content?: ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
  }) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  type: 'alert',
  title: '',
  content: null,
  confirmText: '확인',
  cancelText: '취소',
  onConfirm: undefined,
  onCancel: undefined,

  openModal: (params) =>
    set({
      isOpen: true,
      type: params.type,
      title: params.title || '',
      content: params.content || null,
      confirmText: params.confirmText || '확인',
      cancelText: params.cancelText || '취소',
      onConfirm: params.onConfirm,
      onCancel: params.onCancel,
    }),

  closeModal: () =>
    set({
      isOpen: false,
      title: '',
      content: null,
      onConfirm: undefined,
      onCancel: undefined,
    }),
}));
