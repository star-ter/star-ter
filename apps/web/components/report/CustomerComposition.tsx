import React from 'react';
import { CustomerCompositionData } from '@/types/report.types';

interface CustomerCompositionProps {
  data: CustomerCompositionData;
}

export const CustomerComposition = ({ data }: CustomerCompositionProps) => {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-5 h-full">
      <h3 className="text-sm font-bold text-gray-800 mb-4">3) 고객 구성(성별)</h3>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>남/여 비중</span>
        </div>
        <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-blue-600" 
            style={{ width: `${data.malePercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex justify-between w-32">
          <span>남성</span>
          <span className="font-bold text-gray-900">{data.malePercentage}%</span>
        </div>
        <div className="flex justify-between w-32">
          <span>여성</span>
           <span className="font-bold text-gray-900">{data.femalePercentage}%</span>
        </div>
      </div>
    </div>
  );
};
