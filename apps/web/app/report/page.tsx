import React from 'react';
import { ReportView } from '@/components/report/ReportView';
import { MOCK_REPORT_DATA } from '@/mocks/report-mock';

const ReportPage = () => {
  return <ReportView data={MOCK_REPORT_DATA} />;
};

export default ReportPage;
