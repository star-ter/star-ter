import React, { ReactNode } from 'react';

interface ReportContainerProps {
  children: ReactNode;
}

export const ReportContainer = ({ children }: ReportContainerProps) => {
  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center py-10 print:p-0 print:bg-white">
      <div 
        className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-[15mm] flex flex-col gap-8 print:shadow-none print:w-full print:h-auto"
      >
        {children}
      </div>
    </div>
  );
};
