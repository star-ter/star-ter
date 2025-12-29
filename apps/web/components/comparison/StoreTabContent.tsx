import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AnimatedNumber from '../common/AnimatedNumber';
import { AnalysisData } from '../../types/analysis-types';

interface StoreTabContentProps {
    data: AnalysisData | null;
    initialStoreCount: string;
}

const StoreTabContent: React.FC<StoreTabContentProps> = ({ data, initialStoreCount }) => {
  const [showStoreBars, setShowStoreBars] = useState(false);
  const [expandedStoreCategories, setExpandedStoreCategories] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    // Initial render is false, so we just set true after delay for animation
    const timer = setTimeout(() => setShowStoreBars(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
      <div className="animate-fade-in space-y-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-xs font-bold text-gray-800 mb-1">총 매장 수</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold text-blue-600">
                  {data ? <AnimatedNumber value={data.store.total} /> : initialStoreCount}
                  <span className="text-base font-normal text-gray-600 ml-1">개</span>
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
             <div className="flex flex-col justify-center items-center min-w-[70px]">
                 <span className="text-[10px] text-gray-500 font-semibold">개업률</span>
                 <span className="text-base font-bold text-blue-600">
                    {data && data.store.openingRate !== undefined ? (
                        <AnimatedNumber 
                            value={data.store.openingRate * 10} 
                            format={(n) => (n/10).toFixed(1)} 
                        />
                    ) : '-'}%
                 </span>
             </div>
             <div className="flex flex-col justify-center items-center min-w-[70px]">
                 <span className="text-[10px] text-gray-500 font-semibold">폐업률</span>
                 <span className="text-base font-bold text-red-500">
                    {data && data.store.closingRate !== undefined ? (
                        <AnimatedNumber 
                            value={data.store.closingRate * 10} 
                            format={(n) => (n/10).toFixed(1)} 
                        />
                    ) : '-'}%
                 </span>
             </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-gray-700 border-b border-gray-100 pb-2 mb-2">주요 업종 분포</h4>
          
          {data && data.store.categories ? (
              (() => {
                  const totalList = data.store.categories;
                  const showCount = expandedStoreCategories ? totalList.length : 10;
                  const visibleList = totalList.slice(0, showCount);
                  
                  const maxCount = Math.max(...totalList.map((c) => c.count)) || 1;
                  const totalStores = data.store.total || 1;
                  
                  return (
                    <>
                      {visibleList.map((item) => {
                          const relativePercent = (item.count / maxCount) * 100;
                          const realPercent = Math.round((item.count / totalStores) * 100);
                          const isExpanded = expandedCategories.includes(item.name);
                          
                          const toggleCategory = () => {
                            setExpandedCategories(prev => 
                              prev.includes(item.name) 
                                ? prev.filter(name => name !== item.name)
                                : [...prev, item.name]
                            );
                          };
                          
                          return (
                            <div key={item.name} className="flex flex-col group cursor-pointer" onClick={toggleCategory}>
                                <div className="flex items-center text-sm py-1">
                                    <span className="text-gray-500 w-24 truncate font-medium group-hover:text-blue-600 group-hover:font-bold transition-all" title={item.name}>
                                        {item.name}
                                    </span>
                                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full mx-2 overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 rounded-full opacity-70 group-hover:opacity-100 transition-all duration-[1000ms] ease-out" 
                                            style={{ width: showStoreBars ? `${relativePercent}%` : '0%' }}
                                        ></div>
                                    </div>
                                    <div className="text-right w-20 mr-1">
                                        <span className="font-bold text-gray-800 mr-1">
                                            <AnimatedNumber value={item.count} />
                                        </span>
                                        <span className="text-xs text-gray-400">({realPercent}%)</span>
                                    </div>
                                    <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                                        {isExpanded ? (
                                            <ChevronUp size={14} className="transition-all group-hover:stroke-[3]" />
                                        ) : (
                                            <ChevronDown size={14} className="transition-all group-hover:stroke-[3]" />
                                        )}
                                    </div>
                                </div>
                                
                                <div 
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        isExpanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="text-xs flex justify-center items-center gap-6 py-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">개업 점포</span>
                                            <span className="font-bold text-blue-600">
                                                <AnimatedNumber value={item.open || 0} />개
                                            </span>
                                        </div>
                                        <div className="w-[1px] h-3 bg-gray-300"></div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">폐업 점포</span>
                                            <span className="font-bold text-red-500">
                                                <AnimatedNumber value={item.close || 0} />개
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                          );
                      })}
                      
                      {totalList.length > 10 && (
                        <button 
                          onClick={() => setExpandedStoreCategories(!expandedStoreCategories)}
                          className="w-full py-2 text-xs text-gray-500 font-medium hover:text-blue-600 transition-colors flex items-center justify-center gap-1 mt-2 border-t border-gray-50"
                        >
                          {expandedStoreCategories ? '접기' : '더보기'}
                        </button>
                      )}
                    </>
                  );
              })()
          ) : (
            <div className="text-center text-gray-400 text-xs py-4">데이터를 불러오는 중입니다...</div>
          )}
        </div>
      </div>
  );
};

export default StoreTabContent;
