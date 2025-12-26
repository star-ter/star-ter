import React from 'react';

interface Props {
  stores: {
    name: string;
    category: string;
  }[];
}

export default function StoreList({ stores }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end px-1">
        <h3 className="text-sm font-bold text-gray-900">🏪 주요 매장</h3>
        <span className="text-xs text-gray-500">Top {stores.length}</span>
      </div>
      <div className="space-y-2">
        {stores.map((store, idx) => (
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
    </div>
  );
}