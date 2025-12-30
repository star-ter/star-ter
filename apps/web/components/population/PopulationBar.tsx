import React from 'react';

interface PopulationBarProps {
  isLoading?: boolean;
}

// 유동인구 데이터를 바로 시각화하기 위한 컴포넌트
export const PopulationBar: React.FC<PopulationBarProps> = ({ 
  isLoading = false 
}) => {
  // 히트맵의 gradient stop 지점을 CSS linear-gradient로 변환
  const gradientStyle = {
    background: 'linear-gradient(to right, #0A0A32 0%, #0064FF 23%, #00DCC8 43%, #FFE600 66%, #FF6400 90%, #FFFFFF 100%)'
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-white/90 backdrop-blur-md rounded-xl border border-gray-100 shadow-lg min-w-60">
      <div className="flex justify-between items-center text-xs font-bold text-gray-700">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>유동인구 분석 지표</span>
        </div>
      </div>
      
      {/* 그라데이션 바 */}
      <div 
        className="h-2.5 w-full rounded-full shadow-inner border border-gray-100/50" 
        style={gradientStyle} 
      />
      
      {/* 라벨 및 설명 */}
      <div className="flex justify-between text-[10px] font-medium text-gray-400">
        <div className="flex flex-col items-start gap-1">
          <span>낮음</span>
          <span className="text-[8px] text-gray-300">인구 희소</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span>높음</span>
          <span className="text-[8px] text-gray-300">인구 밀집</span>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
