'use client';

import { createPortal } from 'react-dom';
import { useModalStore } from '@/stores/useModalStore';
import { X } from 'lucide-react';

export default function Modal() {
  const {
    isOpen,
    type,
    title,
    content,
    confirmText,
    cancelText,
    onConfirm,
    closeModal,
  } = useModalStore();

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    closeModal();
  };

  const modalContent = (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={closeModal}
      />

      {/* Modal Card */}
      <div
        className="relative bg-white/95 backdrop-blur-xl rounded-4xl shadow-2xl w-full max-w-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 border border-white/20 ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-2">
          <h3 className="text-[19px] font-bold text-gray-900 tracking-tight">
            {title}
          </h3>
          <button
            onClick={closeModal}
            className="group p-2 rounded-full hover:bg-gray-100/80 transition-all active:scale-95"
          >
            <X
              size={20}
              className="text-gray-400 group-hover:text-gray-600 transition-colors"
            />
          </button>
        </div>

        {/* Content */}
        <div className="px-7 py-4">
          <div className="text-[16px] leading-[1.6] text-gray-600 font-medium">
            {content}
          </div>
        </div>

        {/* Footer (Actions) */}
        {(type === 'confirm' || type === 'alert') && (
          <div className="flex items-center gap-3 px-7 pb-7 pt-4">
            {type === 'confirm' && (
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3.5 text-[15px] font-bold text-gray-500 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                {cancelText || '취소'}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-3.5 text-[15px] font-bold text-white rounded-2xl transition-all shadow-lg active:scale-[0.98] ${
                type === 'confirm'
                  ? 'bg-linear-to-br from-blue-500 to-blue-600 hover:shadow-blue-500/30'
                  : 'bg-linear-to-br from-blue-600 to-indigo-600 hover:shadow-blue-600/30'
              }`}
            >
              {confirmText || '확인'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
