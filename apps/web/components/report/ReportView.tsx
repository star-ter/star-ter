import React from 'react';
import { ReportContainer } from './ReportContainer';
import { ReportHeader } from './ReportHeader';
import { KeyMetrics } from './KeyMetrics';
import { ZoneOverview } from './ZoneOverview';
import { CustomerComposition } from './CustomerComposition';
import { AgeDistribution } from './AgeDistribution';
import { SummaryInsights } from './SummaryInsights';
import { HourlyFlow } from './HourlyFlow';
import { WeeklyCharacteristics } from './WeeklyCharacteristics';
import { CompetitionAnalysis } from './CompetitionAnalysis';
import { ReportConclusion } from './ReportConclusion';
import { ReportData } from '@/types/report.types';

interface ReportViewProps {
  data: ReportData;
}

export const ReportView = ({ data }: ReportViewProps) => {
  return (
    <div className="flex flex-col gap-10 bg-gray-100 items-center justify-center min-h-screen py-10 print:py-0 print:bg-white print:block">
      <ReportContainer>
        <ReportHeader 
          category={data.meta.category} 
          region={data.meta.region}
          generatedAt={data.meta.generatedAt}
        />
        <KeyMetrics data={data.keyMetrics} />
        <div className="flex gap-4 h-48">
          <div className="flex-1 h-full">
            <ZoneOverview data={data.zoneOverview} />
          </div>
          <div className="flex-1 h-full">
            <CustomerComposition data={data.customerComposition} />
          </div>
        </div>
        <AgeDistribution data={data.ageDistribution} />
        <SummaryInsights data={data.summaryInsights} />
      </ReportContainer>

      <div className="print:break-before-page">
        <ReportContainer>
          <ReportHeader 
            category={data.meta.category} 
            region={data.meta.region} 
            generatedAt={data.meta.generatedAt}
            isSecondPage={true}
            meta={{
              radius: data.meta.radius,
              period: data.meta.period,
            }}
          />
          <div className="grid grid-cols-2 gap-4 h-[350px]">
             <HourlyFlow summary={data.hourlyFlow.summary} data={data.hourlyFlow.data} />
             <WeeklyCharacteristics data={data.weeklyCharacteristics} />
          </div>
          <CompetitionAnalysis data={data.competitionAnalysis} />
          <ReportConclusion data={data.conclusion} />
        </ReportContainer>
      </div>
    </div>
  );
};
