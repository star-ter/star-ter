import React from 'react';

interface Store {
  name: string;
  category: string;
  // 추후 주소, 평점 등 상세 정보 추가 가능
}

interface Props {
  stores: Store[];
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
            
            {/* 상세 정보 데모 (현재 데이터에는 없지만 UI 공간 확보) */}
            <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
               <div className="flex items-center text-sm text-gray-500">
                  <span className="w-16 font-medium">영엽시간</span>
                  <span>10:00 - 22:00 (예상)</span>
               </div>
               <div className="flex items-center text-sm text-gray-500">
                  <span className="w-16 font-medium">휴무일</span>
                  <span>연중무휴</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
