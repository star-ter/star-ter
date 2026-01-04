
import React, { useState, useEffect } from 'react';
import { DayOfWeekSalesItem } from '../../types/analysis-types';

interface WeeklySalesGraphProps {
  data?: DayOfWeekSalesItem[];
}

export default function WeeklySalesGraph({ data }: WeeklySalesGraphProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!data || data.length === 0) return <div className="h-[180px] flex items-center justify-center text-gray-400 text-xs">데이터 없음</div>;

  const dayMap: { [key: string]: string } = {
    'mon': '월', 'tue': '화', 'wed': '수', 'thu': '목', 'fri': '금', 'sat': '토', 'sun': '일'
  };

  const values = data.map(item => ({
    label: dayMap[item.day] || item.day,
    value: item.sales
  }));

  const maxVal = Math.max(...values.map(d => d.value), 1);
  // Highlight the max value bar
  const maxIdx = values.reduce((maxI, d, i, arr) => d.value > arr[maxI].value ? i : maxI, 0);
  const total = values.reduce((acc, d) => acc + d.value, 0) || 1;
  const maxPercentage = Math.round((values[maxIdx].value / total) * 100);

  const height = 180;
  const graphHeight = height - 20;

  return (
    <div className="w-full mt-4">
       {/* Caption */}
       <div className="mb-4">
           <h4 className="text-[12px] font-semibold text-gray-500 mb-1">요일별 결제 추정</h4>
           <div className="text-[15px] font-bold text-gray-900 leading-tight">
               전체 결제 중 <span className="text-[#D9515E]">{maxPercentage}%</span>는 <span className="text-[#D9515E]">{values[maxIdx].label}요일</span>에 결제됐어요!
           </div>
       </div>

      <div className="relative w-full h-[180px] bg-slate-50/50 rounded-lg overflow-hidden flex items-end justify-between px-4 pb-6">
        {/* Grid lines background (optional, strictly mimicking reference image which has lines) */}
        <div className="absolute inset-0 pointer-events-none z-0">
            {[0.25, 0.5, 0.75, 1].map(r => (
                <div 
                    key={r} 
                    className="absolute w-full border-t border-gray-100" 
                    style={{ bottom: `${r * (graphHeight - 20) + 20}px`, left: 0 }}
                />
            ))}
        </div>

        {values.map((d, i) => {
            const barHeight = (d.value / maxVal) * (graphHeight - 20); // -20 top padding
            const isMax = i === maxIdx;
            
            return (
                <div key={i} className="relative z-10 flex flex-col items-center justify-end h-full w-full">
                    {/* Bar */}
                    <div 
                        className={`w-6 rounded-t-sm transition-all duration-[800ms] ease-out ${isMax ? 'bg-[#E5858E]' : 'bg-[#90AFFF]'}`}
                        style={{ height: loaded ? `${barHeight}px` : '0px' }}
                    />
                    {/* Label */}
                    <span className="absolute -bottom-5 text-[11px] text-gray-600 font-medium">
                        {d.label}
                    </span>
                </div>
            );
        })}
        
      </div>
    </div>
  );
}
