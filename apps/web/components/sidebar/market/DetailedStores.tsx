import { MarketAnalysisData } from '@/types/market-types';
import React from 'react';

interface Props {
  stores: MarketAnalysisData['stores'];
  onBack: () => void;
}

export default function DetailedStores({ stores, onBack }: Props) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button 
          onClick={onBack}
          className="mr-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-gray-900">경쟁 점포 리스트</h2>
        <span className="ml-2 text-sm text-gray-500 font-medium">{stores.length}개</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {stores.map((store, idx) => (
          <div 
            key={idx}
            className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-gray-900">{store.name}</h3>
              <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full">
                {store.category}
              </span>
            </div>
            
            {/* 상세 정보 */}
            <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
               {store.subcategory && (
                 <div className="flex items-center text-sm text-gray-600">
                    <span className="w-24 font-medium text-gray-500">표준산업분류</span>
                    <span>{store.subcategory}</span>
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
