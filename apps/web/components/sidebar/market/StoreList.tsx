import React from 'react';

interface Props {
  stores: {
    name: string;
    category: string;
  }[];
  onShowMore: () => void;
}

export default function StoreList({ stores, onShowMore }: Props) {
  const INITIAL_COUNT = 4;

  const visibleStores = stores.slice(0, INITIAL_COUNT);
  const hasMore = stores.length > INITIAL_COUNT;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end px-1">
        <h3 className="text-sm font-bold text-gray-900">🏪 주요 매장</h3>
        <span className="text-xs text-gray-500">
          총 {stores.length}개 중 {visibleStores.length}개
        </span>
      </div>
      <div className="space-y-2">
        {visibleStores.map((store, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors"
          >
            <span className="font-medium text-gray-800">{store.name}</span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              {store.category}
            </span>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={onShowMore}
          className="w-full py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        >
          + {stores.length - INITIAL_COUNT}개 매장 더 보기
        </button>
      )}
    </div>
  );
}