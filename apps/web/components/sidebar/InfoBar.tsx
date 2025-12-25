import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { InfoBarData } from '../../types/map-types';

interface InfoBarProps {
  data: InfoBarData | null;
  onClose: () => void;
}

export default function InfoBar({ data, onClose }: InfoBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!data || !mounted) return null;

  const name = data.adm_nm || data.buld_nm || '정보 없음';

  // Parse name to get hierarchy
  // "서울특별시 관악구 행운동" -> ["서울특별시", "관악구", "행운동"]
  const nameParts = name.split(' ');
  const displayName = nameParts[nameParts.length - 1]; // "행운동"
  const subName =
    nameParts.length > 1
      ? nameParts.slice(0, nameParts.length - 1).join(' ')
      : '';

  return createPortal(
    <div className="fixed top-0 left-0 z-50 h-full w-90 bg-white shadow-xl transition-transform duration-300 ease-in-out transform translate-x-0">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            {subName && (
              <div className="text-sm text-gray-500 mb-1">{subName}</div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="text-sm font-medium text-blue-600 mb-1">
              11월 예상 매출
            </div>
            <div className="text-2xl font-bold text-blue-700">
              약 2,975억 원
            </div>
            <div className="mt-4 text-xs text-blue-400">
              * Star-ter 매출값은 추정값 입니다.
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 text-center">
              {/* TODO: 추정매출, 결제 시간대·요일·휴일여부, 성별 등의 정보 fetch 후 그리는 로직 구현 */}
              추정매출, 결제 시간대·요일·휴일여부, 성별 등의 정보가
              들어와야합니다
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
