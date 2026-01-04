import React from 'react';
import ReportResultView from './ReportResultView';
import { Loader2 } from 'lucide-react';
import { ReportRequest } from '../../types/bottom-menu-types';
import { useReport } from '../../hooks/useReport';

interface ReportOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  userSelection?: ReportRequest | null;
}

export default function ReportOverlay({
  isVisible,
  onClose,
  userSelection,
}: ReportOverlayProps) {
  const { data, loading, error } = useReport(
    userSelection?.regionCode || '',
    userSelection?.industryCode || '',
    userSelection?.regionName || '',
    userSelection?.industryName || '',
  );

  if (!isVisible) return null;

  const showLoading = loading || (!data && !error);

  return (
    <>
      {/* 반투명 배경 추가 (Backdrop) */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-90"
        onClick={onClose}
      />
      
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+20px)] z-100 bg-white shadow-2xl rounded-2xl overflow-hidden animate-slide-up transition-all duration-300 ease-in-out w-[60vw] max-w-1000px h-[85vh]`}
      >
        {showLoading && !error && (
          <div className="flex flex-col items-center justify-center h-full bg-white">
            <div className="p-4 rounded-full bg-blue-50 mb-4 animate-pulse">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              보고서를 생성하고 있어요
            </h3>
            <p className="text-sm text-gray-500">잠시만 기다려주세요...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full bg-white">
            <h3 className="text-lg font-bold text-red-600 mb-1">
              오류가 발생했습니다
            </h3>
            <p className="text-sm text-gray-500">{error}</p>
            <button onClick={onClose} className="mt-4 text-blue-600 underline">
              닫기
            </button>
          </div>
        )}

        {!showLoading && data && <ReportResultView onClose={onClose} data={data} />}
      </div>
    </>
  );
}
