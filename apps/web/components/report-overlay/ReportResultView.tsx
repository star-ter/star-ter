import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { ReportHeader } from '../report/ReportHeader';
import { KeyMetrics } from '../report/KeyMetrics';
import { ZoneOverview, CustomerComposition } from '../report/ZoneOverview';
import { AgeDistribution } from '../report/AgeDistribution';
import { SummaryInsights } from '../report/SummaryInsights';
import { HourlyFlow } from '../report/HourlyFlow';
import { WeeklyCharacteristics } from '../report/WeeklyCharacteristics';
import { CompetitionAnalysis } from '../report/CompetitionAnalysis';
import { ReportConclusion } from '../report/ReportConclusion';
import { ReportData } from '@/types/report.types';

interface ReportResultViewProps {
  onClose: () => void;
  regionName: string;
  industryName: string;
}

const MOCK_REPORT_DATA: ReportData = {
  meta: {
    generatedAt: '2025-12-23',
    category: '삼겹살/구이',
    region: '서울 관악구 봉천동',
    radius: 500,
    period: '최근 4주(예시)',
  },
  keyMetrics: {
    estimatedMonthlySales: { max: 90000000 },
    wellDoingMonthlySales: { max: 160000000 },
    floatingPopulation: {
      count: 148000,
      mainTime: '18:00~22:00',
    },
    mainVisitDays: {
      days: ['금', '토'],
      comment: '주말 저녁 수요 강세',
    },
    coreCustomer: {
      ageGroup: '20~34세',
      comment: '데이트/모임 수요 비중 높음',
    },
    competitionIntensity: {
      level: '높음',
      comment: '구이·주점 카테고리 밀집',
    },
  },
  zoneOverview: {
    characteristics: '연남동 메인 상권(도보 중심)',
    visitMotivation: '식사 + 2차(카페/주점) 연계',
    peakTime: '평일 19~21시 / 주말 18~22시',
    inflowPath: '지하철+도보(상권 내부 이동 빈번)',
  },
  customerComposition: {
    malePercentage: 48,
    femalePercentage: 52,
  },
  ageDistribution: {
    age10: 7,
    age20: 34,
    age30: 28,
    age40: 18,
    age50Plus: 13,
  },
  summaryInsights: [
    { category: '패턴', content: '저녁 시간대(특히 19~21시)에 유동이 집중되어 회전율/대기 관리가 중요합니다.' },
    { category: '고객', content: '20~34세 비중이 높아 세트 메뉴·가성비 구성과 사진/리뷰 유도가 유효합니다.' },
    { category: '상권', content: '경쟁 점포가 밀집되어 대표 메뉴(시그니처) 명확화와 피크 시간 전후 프로모션이 필요합니다.' },
  ],
  hourlyFlow: {
    summary: '(더미) 점심은 완만, 저녁은 급증 → 구이 업종 특성 반영',
    data: [
      { timeRange: '11~14시', level: '보통', intensity: 40 },
      { timeRange: '14~17시', level: '낮음', intensity: 20 },
      { timeRange: '17~19시', level: '상승', intensity: 60 },
      { timeRange: '19~21시', level: '피크', intensity: 90 },
      { timeRange: '21~24시', level: '높음', intensity: 75 },
    ],
  },
  weeklyCharacteristics: [
    { day: '월~목', characteristics: '퇴근 후 회식/소모임 중심 · 19~21시 집중' },
    { day: '금', characteristics: '주간 최고치 · 대기/회전 관리 필요' },
    { day: '토', characteristics: '데이트/친구 모임 · 18~22시 폭넓게 높음' },
    { day: '일', characteristics: '저녁 전(17~19시) 수요 존재 · 2차는 상대적으로 감소' },
  ],
  competitionAnalysis: [
    { category: '동종 업종 밀집', summary: '구이/주점/이자카야 다수(더미)', implication: '시그니처/리뷰 포인트 명확화' },
    { category: '가격대 경쟁', summary: '중가~중상가 혼재', implication: '세트 구성 + 추가 메뉴 업셀' },
    { category: '유입 동선', summary: '도보 이동 많고 골목 상권 특성', implication: '간판/입구 가시성, 웨이팅 안내' },
    { category: '연계 업종', summary: '카페/디저트/주점과 연계', implication: '2차 제휴/리뷰 쿠폰 등' },
  ],
  conclusion: [
    { category: '운영', content: '피크 시간대 인력/좌석 회전 설계를 먼저 잡고, 웨이팅 안내를 표준화합니다.' },
    { category: '상품', content: "'대표 메뉴 1개 + 베스트 사이드 1개'로 기억 포인트를 만들고 세트로 노출합니다." },
    { category: '마케팅', content: '20~34세 타깃에 맞춰 사진/리뷰 유도 장치를 넣고, 금-토 집중 프로모션을 테스트합니다.' },
  ],
};

const A4_WIDTH_PX = 794; 
const PAGE_HEIGHT_PX = 1123; 

export default function ReportResultView({ onClose, regionName, industryName }: ReportResultViewProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const reportData = {
    ...MOCK_REPORT_DATA,
    meta: {
      ...MOCK_REPORT_DATA.meta,
      region: regionName,
      category: industryName,
    }
  };

  useEffect(() => {
    const handleResize = () => {
      let width = window.innerWidth;
      
      if (containerRef.current) {
         width = containerRef.current.clientWidth;
      }
      
      const padding = 32; 
      const availableWidth = width - padding;
      
      const newScale = Math.min(availableWidth / A4_WIDTH_PX, 1.2);
      setScale(newScale);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }
    
    handleResize();

    return () => resizeObserver.disconnect();
  }, []);

  const totalHeight = (PAGE_HEIGHT_PX * 2 + 32); 
  const scaledWidth = A4_WIDTH_PX * scale;
  const scaledHeight = totalHeight * scale;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] font-sans flex flex-col items-center justify-center overflow-hidden pointer-events-none">
      
      {/* 보고서 상단 버튼 */}
      <div className="fixed top-1 right-6 z-[110] flex gap-1 pointer-events-auto">
           <button className="bg-white/10 hover:bg-gray-200/60 text-blue-600 p-2 rounded-full transition-colors">
             <Download className="w-4 h-4" />
           </button>
           <button className="bg-white/10 hover:bg-gray-200/60 text-blue-600 p-2 rounded-full transition-colors">
             <Share2 className="w-4 h-4" />
           </button>
           <button 
             onClick={onClose}
             className="bg-white/10 hover:bg-gray-200/60 text-blue-600 p-2 rounded-full transition-colors"
           >
             <X className="w-4 h-4" />
           </button>
      </div>

      {/* Scrollable Window Area */}
      <div className="pointer-events-auto overflow-y-auto overflow-x-hidden rounded-sm shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
           style={{ maxHeight: '90vh', maxWidth: '100vw' }}
      >
        
        {/* Dimensions Wrapper */}
        <div style={{ width: scaledWidth, height: scaledHeight, position: 'relative' }}>
          
          {/* Scaled Content - Scaled from top-left */}
          <div 
            className="flex flex-col gap-8 origin-top-left"
            style={{ 
              width: `${A4_WIDTH_PX}px`,
              transform: `scale(${scale})`,
            }}
          >
            {/* Page 1 */}
            <div 
              className="bg-white shadow-2xl p-12 flex flex-col gap-8 animate-slide-up"
              style={{ width: `${A4_WIDTH_PX}px`, minHeight: `${PAGE_HEIGHT_PX}px` }}
            >
                <ReportHeader 
                  category={reportData.meta.category} 
                  region={reportData.meta.region} 
                  generatedAt={reportData.meta.generatedAt} 
                />
                
                <KeyMetrics data={reportData.keyMetrics} />
                
                <div className="grid grid-cols-2 gap-6 h-64">
                    <ZoneOverview data={reportData.zoneOverview} />
                    <CustomerComposition data={reportData.customerComposition} />
                </div>
                
                <div className="mt-2">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">4) 연령대 분포(요약)</h3>
                    <AgeDistribution data={reportData.ageDistribution} />
                </div>

                <SummaryInsights data={reportData.summaryInsights} />
            </div>

            {/* Page 2 */}
            <div 
              className="bg-white shadow-2xl p-12 flex flex-col gap-10 animate-slide-up animation-delay-200"
              style={{ width: `${A4_WIDTH_PX}px`, minHeight: `${PAGE_HEIGHT_PX}px` }}
            >
              <ReportHeader 
                  category={reportData.meta.category} 
                  region={reportData.meta.region} 
                  generatedAt={reportData.meta.generatedAt}
                  isSecondPage={true}
                  meta={{
                    radius: reportData.meta.radius,
                    period: reportData.meta.period
                  }}
                />

                <div className="grid grid-cols-2 gap-8">
                  <HourlyFlow 
                    summary={reportData.hourlyFlow.summary} 
                    data={reportData.hourlyFlow.data} 
                  />
                  <WeeklyCharacteristics data={reportData.weeklyCharacteristics} />
                </div>

                <CompetitionAnalysis data={reportData.competitionAnalysis} />

                <ReportConclusion data={reportData.conclusion} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
