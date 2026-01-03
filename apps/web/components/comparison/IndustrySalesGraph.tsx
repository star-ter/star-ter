/**
 * IndustrySalesGraph.tsx - 업종별 매출 그래프 컴포넌트
 * 
 * ## 핵심 개념 설명
 * 
 * ### 1. CSS 기반 막대 그래프
 * - recharts 같은 라이브러리 없이 순수 CSS와 div로 막대 그래프를 구현합니다.
 * - transition CSS 속성으로 애니메이션을 구현합니다.
 * 
 * ### 2. useState + useEffect 패턴
 * - loaded 상태를 사용해 컴포넌트 마운트 후 애니메이션을 트리거합니다.
 * - 이렇게 하면 막대가 0에서 실제 높이까지 부드럽게 올라갑니다.
 * 
 * ### 3. 데이터 정규화 (Normalization)
 * - 가장 높은 값을 기준으로 다른 값들의 비율을 계산합니다.
 * - 예: maxVal이 100이고 현재값이 50이면, 막대 높이는 50%가 됩니다.
 */

import React, { useState, useEffect } from 'react';

// props 타입 정의 - TopIndustry 타입을 직접 정의
interface TopIndustry {
  name: string;   // 업종명
  ratio: number;  // 점유율 (0~1 사이 비율)
}

interface IndustrySalesGraphProps {
  data?: TopIndustry[];  // 업종별 매출 데이터 배열
}

export default function IndustrySalesGraph({ data }: IndustrySalesGraphProps) {
  // 애니메이션 트리거용 state
  const [loaded, setLoaded] = useState(false);

  // 컴포넌트 마운트 후 100ms 뒤에 loaded를 true로 설정
  // 이렇게 하면 막대가 0에서 시작해서 올라가는 애니메이션이 보입니다
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer); // cleanup - 메모리 누수 방지
  }, []);

  // 데이터가 없으면 안내 메시지 표시
  if (!data || data.length === 0) {
    return (
      <div className="h-180px flex items-center justify-center text-gray-400 text-xs">
        업종 데이터 없음
      </div>
    );
  }

  // Top 5만 사용 (plan.md 요구사항)
  const top5 = data.slice(0, 5);

  // 가장 높은 ratio 찾기 (막대 높이 계산용)
  const maxRatio = Math.max(...top5.map(d => d.ratio), 0.01); // 최소값 0.01로 0 나눗셈 방지
  
  // 가장 높은 업종 찾기 (강조 표시용)
  const maxIdx = top5.reduce((maxI, d, i, arr) => 
    d.ratio > arr[maxI].ratio ? i : maxI, 0
  );
  
  // 캡션에 표시할 백분율 계산
  const maxPercentage = Math.round(top5[maxIdx].ratio * 100);
  const maxName = top5[maxIdx].name;

  // 그래프 높이 설정
  const height = 180;
  const graphHeight = height - 30; // 라벨 영역 제외

  return (
    <div className="w-full mt-6">
      {/* 캡션 - plan.md 요구사항: "가장 높은 업종에 대한 코멘트" */}
      <div className="mb-4">
        <h4 className="text-[12px] font-semibold text-gray-500 mb-1">업종별 매출 추정</h4>
        <div className="text-[15px] font-bold text-gray-900 leading-tight">
          전체 업종 중 <span className="text-[#D9515E]">{maxName}</span>이(가) 
          <span className="text-[#D9515E]"> {maxPercentage}%</span>로 가장 높아요!
        </div>
      </div>

      {/* 그래프 영역 */}
      <div className="relative w-full h-[180px] bg-slate-50/50 rounded-lg overflow-hidden flex items-end justify-between px-4 pb-8">
        {/* 배경 격자선 */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {[0.25, 0.5, 0.75, 1].map(r => (
            <div 
              key={r} 
              className="absolute w-full border-t border-gray-100" 
              style={{ bottom: `${r * (graphHeight - 20) + 20}px`, left: 0 }}
            />
          ))}
        </div>

        {/* 막대 그래프 */}
        {top5.map((d, i) => {
          // 막대 높이 계산: (현재값 / 최대값) * 그래프높이
          const barHeight = (d.ratio / maxRatio) * (graphHeight - 20);
          const isMax = i === maxIdx; // 가장 높은 막대인지 확인
          
          return (
            <div key={i} className="relative z-10 flex flex-col items-center justify-end h-full w-full">
              {/* 막대 - isMax이면 다른 색상으로 강조 */}
              <div 
                className={`w-8 rounded-t-sm transition-all duration-800 ease-out ${
                  isMax ? 'bg-[#E5858E]' : 'bg-[#90AFFF]'
                }`}
                style={{ height: loaded ? `${barHeight}px` : '0px' }}
              />
              {/* 업종명 라벨 */}
              <span className="absolute -bottom-6 text-[10px] text-gray-500 font-medium whitespace-nowrap truncate max-w-[60px]">
                {d.name.length > 5 ? `${d.name.slice(0, 5)}..` : d.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
