import React from 'react';
import { Store, Building, Building2 } from 'lucide-react';

interface SizeStepProps {
  value: number;
  onChange: (size: number) => void;
}

// Mock sizes based on user image intuition (Small ~24m2, Medium ~37m2, Large ~50m2)
export const SIZES = [
  { label: '소형', size: 24, pyeong: 7, Icon: Store },
  { label: '중형', size: 37, pyeong: 11, Icon: Building },
  { label: '대형', size: 50, pyeong: 15, Icon: Building2 },
];

export default function SizeStep({ value, onChange }: SizeStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-xl font-bold">
        <span className="text-blue-600">어떤 크기의 매장</span>을 생각하시는지
        알려주세요.
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {SIZES.map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center justify-center p-4 py-8 rounded-xl border transition-all
              ${
                value === item.size
                  ? 'border-blue-500 bg-blue-50 text-blue-600 ring-1 ring-blue-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            onClick={() => onChange(item.size)}
          >
            <div
              className={`mb-3 p-3 rounded-full ${value === item.size ? 'bg-blue-100' : 'bg-gray-100'}`}
            >
              <item.Icon
                size={32}
                strokeWidth={1.5}
                className={
                  value === item.size ? 'text-blue-600' : 'text-gray-500'
                }
              />
            </div>
            <div className="font-bold text-lg mb-1">{item.label}</div>
            <div className="text-sm text-gray-500">
              {item.size}m²
              <br />
              <span className="text-xs">({item.pyeong}평)</span>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Input */}
      <div className="mt-4">
        <label className="text-sm text-gray-500 mb-1 block">
          직접 입력 (m²)
        </label>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="예: 30"
        />
      </div>
    </div>
  );
}
