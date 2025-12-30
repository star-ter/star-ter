
import React, { useState, useEffect } from 'react';
import { TimeOfDaySalesItem } from '../../types/analysis-types';

interface TimeOfDaySalesGraphProps {
  data?: TimeOfDaySalesItem[];
}

export default function TimeOfDaySalesGraph({ data }: TimeOfDaySalesGraphProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!data || data.length === 0) return null;

  const values = data.map(item => ({
    label: item.time,
    value: item.sales,
    key: item.time
  }));

  const maxVal = Math.max(...values.map(d => d.value), 1);
  const maxIdx = values.reduce((maxI, d, i, arr) => d.value > arr[maxI].value ? i : maxI, 0);
  const total = values.reduce((acc, d) => acc + d.value, 0) || 1;
  const maxPercentage = Math.round((values[maxIdx].value / total) * 100);
  const maxLabel = values[maxIdx].label; // e.g., '11~14'
  
  // Custom time label formatting for caption
  const formatTimeCaption = (label: string) => {
      if (label.startsWith('11')) return '점심시간';
      if (label.startsWith('17')) return '저녁시간';
      if (label.startsWith('00') || label.startsWith('06') || label.startsWith('21')) return '새벽/밤';
      return `${label}시 시간대`;
  };

  const height = 180;
  const graphHeight = height - 20;

  return (
    <div className="w-full mt-6">
       {/* Caption */}
       <div className="mb-4">
           <h4 className="text-[12px] font-semibold text-gray-500 mb-1">시간대별 결제 추정</h4>
           <div className="text-[15px] font-bold text-gray-900 leading-tight">
               전체 결제 중 <span className="text-[#D9515E]">{maxPercentage}%</span>는 <span className="text-[#D9515E]">{formatTimeCaption(maxLabel)}</span>에 결제됐어요!
           </div>
       </div>

      <div className="relative w-full h-[180px] bg-slate-50/50 rounded-lg overflow-hidden flex items-end justify-between px-2 pb-8">
        {/* Background Grid Lines */}
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
            const barHeight = (d.value / maxVal) * (graphHeight - 20); 
            const isMax = i === maxIdx;
            
            return (
                <div key={i} className="relative z-10 flex flex-col items-center justify-end h-full w-full">
                    <div 
                        className={`w-6 rounded-t-sm transition-all duration-[800ms] ease-out ${isMax ? 'bg-[#E5858E]' : 'bg-[#90AFFF]'}`}
                        style={{ height: loaded ? `${barHeight}px` : '0px' }}
                    />
                    <span className="absolute -bottom-6 text-[10px] text-gray-500 font-medium whitespace-nowrap">
                        {d.label}
                    </span>
                </div>
            );
        })}
      </div>
    </div>
  );
}
