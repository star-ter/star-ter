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
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

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
  const [scale, setScale] = useState(0.8);
  const containerRef = useRef<HTMLDivElement>(null);
  // 페이지별 ref 분리
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  const reportData = data;

  const handleDownloadPDF = async () => {
    // 캡처할 페이지들을 배열로 관리
    const pages = [page1Ref.current, page2Ref.current];
    if (pages.some(page => !page)) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width mm
      const imgHeight = 297; // A4 height mm

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page) continue;

        // 각 페이지를 개별적으로 캡처
        const dataUrl = await toPng(page, {
          quality: 0.95,
          cacheBust: true,
          style: {
            transform: 'scale(1)', // 캡처 시 스케일 1:1 강제
            width: `${A4_WIDTH_PX}px`,
            height: `${PAGE_HEIGHT_PX}px`,
            backgroundColor: '#ffffff', // 배경 흰색 고정
          },
          pixelRatio: 2, // 고해상도
        });

        // 첫 페이지가 아니면 새 페이지 추가
        if (i > 0) pdf.addPage();
        
        // 꽉 찬 A4 이미지로 추가 (여백 없이)
        pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      }

      const fileName = `리포트_${data.meta.region.replace(/\s+/g, '_')}_${data.meta.category}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(`PDF 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      if (width <= 0) return;

      const padding = 48; 
      const availableWidth = Math.max(width - padding, 200); 
      
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

  const totalHeight = (PAGE_HEIGHT_PX * 2 + 64); 
  const scaledWidth = A4_WIDTH_PX * scale;
  const scaledHeight = totalHeight * scale;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full font-sans flex flex-col items-center justify-start overflow-hidden bg-gray-50/50"
    >
      {/* 보고서 상단 버튼 - 더 강조된 스타일 */}
      <div className="absolute top-4 right-6 z-110 flex gap-3 pointer-events-auto">
        <button 
          onClick={handleDownloadPDF}
          className="bg-white hover:bg-gray-50 text-blue-600 p-2.5 rounded-full shadow-lg transition-all active:scale-95 border border-gray-200"
        >
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
          {/* Scaled Content - transform on parent */}
          <div
            className="flex flex-col gap-12 origin-top-left"
            style={{
              width: `${A4_WIDTH_PX}px`,
              transform: `scale(${scale})`,
            }}
          >
            {/* Page 1 */}
            <div
              ref={page1Ref}
              className="bg-white p-12 flex flex-col gap-5 animate-slide-up"
              style={{
                width: `${A4_WIDTH_PX}px`,
                height: `${PAGE_HEIGHT_PX}px`,  // A4 고정
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
              }}
            >
              <ReportHeader
                category={reportData.meta.category}
                region={reportData.meta.region}
                generatedAt={reportData.meta.generatedAt}
              />

              <KeyMetrics data={reportData.keyMetrics} />

              <div className="grid grid-cols-2 gap-6 h-48">
                <ZoneOverview data={reportData.zoneOverview} />
                <CustomerComposition data={reportData.customerComposition} />
              </div>

              <div className="mt-1">
                <h3 className="text-sm font-bold text-gray-800 mb-2 border-l-4 border-blue-500 pl-3">
                  4) 연령대 분포(요약)
                </h3>
                <AgeDistribution data={reportData.ageDistribution} />
              </div>

              <SummaryInsights data={reportData.summaryInsights} />
            </div>

            {/* Page 2 */}
            <div
              ref={page2Ref}
              className="bg-white p-12 flex flex-col gap-8 animate-slide-up animation-delay-200"
              style={{
                width: `${A4_WIDTH_PX}px`,
                height: `${PAGE_HEIGHT_PX}px`, // A4 고정
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
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
