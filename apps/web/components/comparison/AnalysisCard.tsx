
import React from 'react';
import SalesTrendGraph from './SalesTrendGraph';

interface AnalysisCardProps {
  title: string;
  address: string;
  estimatedSales: string;
  salesChange: string; // e.g., "+3.5%"
  storeCount: string;
  color?: string;
  onClose: () => void;
  onClear: () => void;
  hoveredTab?: string | null;
  onTabHover?: (tab: string | null) => void;
  activeTab?: 'sales' | 'store' | 'population';
  onTabChange?: (tab: 'sales' | 'store' | 'population') => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export default function AnalysisCard({
  title,
  address,
  estimatedSales,
  storeCount,
  color = '#4A90E2',
  onClose,
  onClear,
  hoveredTab,
  onTabHover,
  activeTab = 'sales',
  onTabChange,
  scrollRef,
  onScroll,
}: AnalysisCardProps) {
  return (
    <div className="bg-white/60 rounded-3xl shadow-xl p-5 w-[320px] h-[350px] flex flex-col relative animate-fade-in-up backdrop-blur-sm">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center justify-center gap-2">
          {title}
          <button
            className="text-xs font-normal text-blue-500 px-2 py-0.5 rounded hover:font-semibold hover:text-blue-600 transition"
            onClick={() => navigator.clipboard.writeText(address)}
          >
            주소 복사
          </button>
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-4">
        <button
          className={`flex-1 pb-2 text-sm transition-all ${
            activeTab === 'sales'
              ? 'font-semibold text-blue-600 border-b-2 border-blue-600'
              : hoveredTab === 'sales'
                ? 'text-gray-600 font-semibold border-b-2 border-blue-600/30'
                : 'font-medium text-gray-400 hover:text-gray-600 hover:font-semibold hover:border-b-2 hover:border-blue-600/30'
          }`}
          onMouseEnter={() => onTabHover?.('sales')}
          onMouseLeave={() => onTabHover?.(null)}
          onClick={() => onTabChange?.('sales')}
        >
          상권
        </button>
        <button
          className={`flex-1 pb-2 text-sm transition-all ${
            activeTab === 'store'
              ? 'font-semibold text-blue-600 border-b-2 border-blue-600'
              : hoveredTab === 'store'
                ? 'text-gray-600 font-semibold border-b-2 border-blue-600/30'
                : 'text-gray-400 hover:text-gray-600 hover:font-semibold hover:border-b-2 hover:border-blue-600/30'
          }`}
          onMouseEnter={() => onTabHover?.('store')}
          onMouseLeave={() => onTabHover?.(null)}
          onClick={() => onTabChange?.('store')}
        >
          매장
        </button>
        <button
          className={`flex-1 pb-2 text-sm transition-all ${
            activeTab === 'population'
              ? 'font-semibold text-blue-600 border-b-2 border-blue-600'
              : hoveredTab === 'population'
                ? 'text-gray-600 font-semibold border-b-2 border-blue-600/30'
                : 'text-gray-400 hover:text-gray-600 hover:font-semibold hover:border-b-2 hover:border-blue-600/30'
          }`}
          onMouseEnter={() => onTabHover?.('population')}
          onMouseLeave={() => onTabHover?.(null)}
          onClick={() => onTabChange?.('population')}
        >
          주거인구
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div 
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6"
      >
        {activeTab === 'sales' && (
          <div className="animate-fade-in space-y-6">
            {/* Main Metric */}
            <div>
              <p className="text-xs font-bold text-gray-800 mb-1">
                11월 상권 추정 매출
              </p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-blue-600">
                  {estimatedSales}
                  {/* TODO: [API Integration]
                      실제 매출 데이터 API 연동 필요
                      - Endpoint: GET /api/analysis/sales-estimate?regionId={regionCode}
                  */}
                </span>
              </div>
            </div>

            {/* Graph */}
            <SalesTrendGraph color={color} />

            {/* Additional Sales Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-700 mb-3">요일별 매출 비중</h4>
              {/* TODO: [API Integration] Fetch day of week sales data */}
              <div className="flex justify-between items-end h-16 gap-1">
                {['월', '화', '수', '목', '금', '토', '일'].map((day, idx) => (
                  <div key={day} className="flex flex-col items-center flex-1 gap-1">
                    <div className="w-full bg-blue-100 rounded-t-sm relative group cursor-pointer" style={{ height: `${[10, 12, 14, 15, 20, 18, 11][idx] * 2}%` }}>
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block text-[10px] bg-gray-800 text-white px-1 rounded whitespace-nowrap">
                         {[10, 12, 14, 15, 20, 18, 11][idx]}%
                       </div>
                       <div className="w-full h-full bg-blue-500 opacity-60 hover:opacity-100 transition-opacity rounded-t-sm"></div>
                    </div>
                    <span className="text-[10px] text-gray-500">{day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
               <h4 className="text-xs font-bold text-gray-700 mb-3">시간대별 매출 비중</h4>
               {/* TODO: [API Integration] Fetch time of day sales data */}
               <div className="space-y-2">
                  <div className="flex items-center text-xs">
                    <span className="w-16 text-gray-500">점심 (11-14)</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-orange-400 w-[45%] rounded-full"></div></div>
                    <span className="ml-2 font-bold text-gray-700">45%</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-16 text-gray-500">저녁 (17-21)</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-blue-500 w-[35%] rounded-full"></div></div>
                    <span className="ml-2 font-bold text-gray-700">35%</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="w-16 text-gray-500">기타</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-gray-400 w-[20%] rounded-full"></div></div>
                    <span className="ml-2 font-bold text-gray-700">20%</span>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="animate-fade-in space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-800 mb-1">총 매장 수</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-extrabold text-blue-600">{storeCount}<span className="text-base font-normal text-gray-600 ml-1">개</span></span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-2">주요 업종 분포</h4>
              {/* TODO: [API Integration] Fetch real store categories */}
              {[
                { name: '한식', count: 120, percent: 30 },
                { name: '카페/디저트', count: 80, percent: 20 },
                { name: '편의점', count: 40, percent: 10 },
                { name: '치킨', count: 35, percent: 8 },
                { name: '분식', count: 30, percent: 7 },
                { name: '호프/주점', count: 25, percent: 6 },
                { name: '미용실', count: 20, percent: 5 },
                { name: '약국', count: 15, percent: 4 },
              ].map((item) => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 w-20">{item.name}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full mx-2">
                    <div className="h-full bg-blue-500 rounded-full opacity-70" style={{ width: `${item.percent * 2}%` }}></div>
                  </div>
                  <div className="text-right w-20">
                    <span className="font-bold text-gray-800 mr-1">{item.count}</span>
                    <span className="text-xs text-gray-400">({item.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'population' && (
          <div className="animate-fade-in space-y-6">
            {/* TODO: [API Integration] Fetch population data */}
            <div>
              <p className="text-xs font-bold text-gray-800 mb-1">총 주거 인구</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-3xl font-extrabold text-blue-600">12,500<span className="text-base font-normal text-gray-600 ml-1">명</span></span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-700 mb-3">성별 비율</h4>
              <div className="flex h-4 rounded-full overflow-hidden mb-2">
                <div className="bg-blue-400 w-[48%] flex items-center justify-center text-[10px] text-white">남성 48%</div>
                <div className="bg-pink-400 w-[52%] flex items-center justify-center text-[10px] text-white">여성 52%</div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <h4 className="text-xs font-bold text-gray-700 mb-3">연령대별 비율</h4>
              <div className="space-y-3">
                {[
                  { age: '10대', percent: 15, color: 'bg-green-400' },
                  { age: '20대', percent: 35, color: 'bg-blue-500' },
                  { age: '30대', percent: 28, color: 'bg-blue-400' },
                  { age: '40대', percent: 15, color: 'bg-purple-400' },
                  { age: '50대+', percent: 7, color: 'bg-gray-400' },
                ].map((item) => (
                  <div key={item.age} className="flex items-center gap-2">
                    <span className="w-8 text-xs text-gray-500">{item.age}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-8 text-right">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
               <h4 className="text-xs font-bold text-gray-700 mb-2"> 직장 인구</h4>
               <div className="flex items-end gap-1">
                 <span className="text-xl font-bold text-gray-800">8,400</span>
                 <span className="text-xs text-gray-500 mb-1">명</span>
               </div>
               <p className="text-[10px] text-gray-400 mt-1">주요 직장: 판매직, 사무직, 서비스직 위주</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}

    </div>
  );
}
