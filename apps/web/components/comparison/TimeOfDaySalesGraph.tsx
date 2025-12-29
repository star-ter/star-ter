
import React from 'react';

interface TimeOfDaySalesGraphProps {
  data?: {
    t0006: string;
    t0611: string;
    t1114: string;
    t1417: string;
    t1721: string;
    t2124: string;
  };
}

export default function TimeOfDaySalesGraph({ data }: TimeOfDaySalesGraphProps) {
  if (!data) return null;

  const values = [
    { label: '00~06', value: parseInt(data.t0006, 10) || 0, key: 't0006' },
    { label: '06~11', value: parseInt(data.t0611, 10) || 0, key: 't0611' },
    { label: '11~14', value: parseInt(data.t1114, 10) || 0, key: 't1114' },
    { label: '14~17', value: parseInt(data.t1417, 10) || 0, key: 't1417' },
    { label: '17~21', value: parseInt(data.t1721, 10) || 0, key: 't1721' },
    { label: '21~24', value: parseInt(data.t2124, 10) || 0, key: 't2124' },
  ];

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
                        className={`w-6 rounded-t-sm transition-all duration-500 ${isMax ? 'bg-[#E5858E]' : 'bg-[#90AFFF]'}`}
                        style={{ height: `${barHeight}px` }}
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
