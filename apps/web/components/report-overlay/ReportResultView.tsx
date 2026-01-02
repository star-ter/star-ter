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
  data: ReportData;
}

const A4_WIDTH_PX = 794;
const PAGE_HEIGHT_PX = 1123;

export default function ReportResultView({
  onClose,
  data,
}: ReportResultViewProps) {
  const [scale, setScale] = useState(0.8); // 0 대신 0.8로 시작하여 투명화 방지
  const containerRef = useRef<HTMLDivElement>(null);

  const reportData = data;

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      if (width <= 0) return;

      const padding = 48; // 더 넉넉한 여백
      const availableWidth = Math.max(width - padding, 200); // 최소 너비 보장
      
      const newScale = Math.min(availableWidth / A4_WIDTH_PX, 1.1);
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

  const totalHeight = (PAGE_HEIGHT_PX * 2 + 64); // 페이지 간격 및 하단 여백 포함
  const scaledWidth = A4_WIDTH_PX * scale;
  const scaledHeight = totalHeight * scale;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full font-sans flex flex-col items-center justify-start overflow-hidden bg-gray-50/50"
    >
      {/* 보고서 상단 버튼 - 더 강조된 스타일 */}
      <div className="absolute top-4 right-6 z-110 flex gap-3 pointer-events-auto">
        <button className="bg-white hover:bg-gray-50 text-blue-600 p-2.5 rounded-full shadow-lg transition-all active:scale-95 border border-gray-200">
          <Download className="w-5 h-5" />
        </button>
        <button className="bg-white hover:bg-gray-50 text-blue-600 p-2.5 rounded-full shadow-lg transition-all active:scale-95 border border-gray-200">
          <Share2 className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="bg-white hover:bg-gray-50 text-red-500 p-2.5 rounded-full shadow-lg transition-all active:scale-95 border border-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 스크롤 영역 */}
      <div
        className="w-full h-full pointer-events-auto overflow-y-auto overflow-x-hidden flex justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ paddingBottom: '4rem' }}
      >
        <div
          style={{
            width: scaledWidth,
            height: scaledHeight,
            position: 'relative',
            marginTop: '3rem',
            transition: 'width 0.3s ease, height 0.3s ease', // 스케일 변경 시 부드럽게
          }}
        >
          {/* Scaled Content */}
          <div
            className="flex flex-col gap-12 origin-top-left"
            style={{
              width: `${A4_WIDTH_PX}px`,
              transform: `scale(${scale})`,
            }}
          >
            {/* Page 1 */}
            <div
              className="bg-white p-12 flex flex-col gap-8 animate-slide-up"
              style={{
                width: `${A4_WIDTH_PX}px`,
                minHeight: `${PAGE_HEIGHT_PX}px`,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <ReportHeader
                category={reportData.meta.category}
                region={reportData.meta.region}
                generatedAt={reportData.meta.generatedAt}
              />

              <KeyMetrics data={reportData.keyMetrics} />

              <div className="grid grid-cols-2 gap-8 h-64">
                <ZoneOverview data={reportData.zoneOverview} />
                <CustomerComposition data={reportData.customerComposition} />
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">
                  4) 연령대 분포(요약)
                </h3>
                <AgeDistribution data={reportData.ageDistribution} />
              </div>

              <SummaryInsights data={reportData.summaryInsights} />
            </div>

            {/* Page 2 */}
            <div
              className="bg-white p-12 flex flex-col gap-10 animate-slide-up animation-delay-200"
              style={{
                width: `${A4_WIDTH_PX}px`,
                minHeight: `${PAGE_HEIGHT_PX}px`,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              }}
            >
              <ReportHeader
                category={reportData.meta.category}
                region={reportData.meta.region}
                generatedAt={reportData.meta.generatedAt}
                isSecondPage={true}
                meta={{
                  radius: reportData.meta.radius,
                  period: reportData.meta.period,
                }}
              />

              <div className="grid grid-cols-2 gap-10">
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
