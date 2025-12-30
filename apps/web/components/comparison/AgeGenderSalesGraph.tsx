
import React, { useState, useEffect } from 'react';
import { AgeSalesItem, GenderSalesItem } from '../../types/analysis-types';

interface AgeGenderSalesGraphProps {
  ageData?: AgeSalesItem;
  genderData?: GenderSalesItem;
}

export default function AgeGenderSalesGraph({ ageData, genderData }: AgeGenderSalesGraphProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!ageData || !genderData) return null;

  // 1. Calculate Ratios
  const m = genderData.male;
  const f = genderData.female;
  const totalGender = m + f || 1;
  const mRatio = m / totalGender;
  const fRatio = f / totalGender;

  // 2. Prepare Segments
  const ages = [
    { key: '10s', label: '10대' },
    { key: '20s', label: '20대' },
    { key: '30s', label: '30대' },
    { key: '40s', label: '40대' },
    { key: '50s', label: '50대' },
    { key: '60s', label: '60대 이상' },
  ];

  // Calculate estimated distributed sales
  const segments = ages.map(age => {
    // Try both keys: '10s' (from backend logic usually) or 'a10' (legacy mapping fallback if needed)
    // Based on interface AgeSalesItem { [key: string]: number }
    const ageTotal = ageData[age.key] || ageData[`a${age.key.slice(0, 2)}`] || 0;
    const mVal = ageTotal * mRatio;
    const fVal = ageTotal * fRatio;
    return {
       label: age.label,
       male: mVal,
       female: fVal,
       total: ageTotal
    };
  });

  // 3. Find Max Segment for Highlight Caption
  let maxSegmentVal = 0;
  let maxSegmentName = '';
  const totalSales = segments.reduce((acc, curr) => acc + curr.total, 0) || 1;

  segments.forEach(seg => {
      if (seg.male > maxSegmentVal) {
          maxSegmentVal = seg.male;
          maxSegmentName = `남성 ${seg.label}`;
      }
      if (seg.female > maxSegmentVal) {
          maxSegmentVal = seg.female;
          maxSegmentName = `여성 ${seg.label}`;
      }
  });

  const maxPercentage = Math.round((maxSegmentVal / totalSales) * 100);
  const maxBarVal = Math.max(...segments.map(s => Math.max(s.male, s.female)));

  return (
    <div className="w-full mt-6">
       {/* Caption */}
       <div className="mb-4">
           <h4 className="text-[12px] font-semibold text-gray-500 mb-1">성별 및 연령대별 결제 추정</h4>
           <div className="text-[15px] font-bold text-gray-900 leading-tight">
               전체 결제 중 <span className="text-[#D9515E]">{maxPercentage}%</span>는 <span className="text-[#D9515E]">{maxSegmentName}</span> 고객이 결제했어요!
           </div>
       </div>

       {/* Legend */}
       <div className="flex justify-center gap-4 mb-4">
           <div className="flex items-center gap-1.5">
               <div className="w-8 h-4 bg-[#90AFFF] rounded-sm"></div>
               <span className="text-xs text-gray-600">남성</span>
           </div>
           <div className="flex items-center gap-1.5">
               <div className="w-8 h-4 bg-[#D9918C] rounded-sm"></div>
               <span className="text-xs text-gray-600">여성</span>
           </div>
       </div>

       {/* Graph */}
       <div className="relative w-full h-[200px] flex items-end justify-between px-2 pb-6 border-b border-gray-100">
           {/* Grid Lines - Background Layer */}
           <div className="absolute inset-0 w-full h-full flex flex-col justify-between pb-6 -z-0">
                {[1, 0.75, 0.5, 0.25, 0].map((t, i) => (
                    <div key={i} className={`w-full border-t ${t===0 ? 'border-gray-800' : 'border-gray-100'}`}></div>
                ))}
           </div>

           {/* Bars - Foreground Layer */}
           {segments.map((seg, i) => {
               // Fix height calculation
               const mH = (seg.male / maxBarVal) * 160; // 160px max bar height
               const fH = (seg.female / maxBarVal) * 160;

               return (
                   <div key={i} className="relative z-10 flex flex-col items-center justify-end h-full w-full mx-1">
                       <div className="flex gap-[2px] items-end">
                           <div 
                              className="w-3 bg-[#90AFFF] rounded-t-sm transition-all duration-[800ms] ease-out" 
                              style={{ height: loaded ? `${mH}px` : '0px' }}
                            ></div>
                           <div 
                              className="w-3 bg-[#D9918C] rounded-t-sm transition-all duration-[800ms] ease-out" 
                              style={{ height: loaded ? `${fH}px` : '0px' }}
                            ></div>
                       </div>
                       <span className="absolute -bottom-6 text-[11px] text-gray-600 font-medium whitespace-nowrap">
                           {seg.label.replace('대', '대').replace(' 이상', '')}
                       </span>
                   </div>
               )
           })}
       </div>
    </div>
  );
}
