import React from 'react';
import { X } from 'lucide-react';

interface InfoBarHeaderProps {
  title: React.ReactNode;
  subTitle?: React.ReactNode;
  onClose: () => void;
}

export default function InfoBarHeader({
  title,
  subTitle,
  onClose,
}: InfoBarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <div>
        {subTitle && (
          <div className="text-sm text-gray-500 mb-1">{subTitle}</div>
        )}
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X size={24} className="text-gray-500" />
      </button>
    </div>
  );
}
