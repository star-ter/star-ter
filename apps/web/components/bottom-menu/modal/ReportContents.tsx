import React, { useState } from 'react';
import { IndustryCategory, ReportRequest } from '../../../types/bottom-menu-types';

interface ReportContentsProps {
  onClose: () => void;
  categories: IndustryCategory[];
  onCreateReport: (data: ReportRequest) => void;
  initialRegion?: { name: string; code: string };
}

export default function ReportContents({
  onClose,
  categories,
  onCreateReport,
  initialRegion
}: ReportContentsProps) {
  const [selectedRegion, setSelectedRegion] = useState(initialRegion || { name: '', code: '' });
  const [selectedIndustry, setSelectedIndustry] = useState<{name: string; code: string} | null>(null);
  
  const isRegionSelected = !!selectedRegion.code;

  const handleRegionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRegion({ name: e.target.value, code: 'dummy-code' });
  };

  const handleSubmit = () => {
    if (selectedRegion.code && selectedIndustry) {
      onCreateReport({
        regionCode: selectedRegion.code,
        regionName: selectedRegion.name,
        industryCode: selectedIndustry.code,
        industryName: selectedIndustry.name
      });
      onClose();
    }
  };

  return (
    <div className="relative w-[360px] bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up font-sans">
      <div className="flex items-center gap-3 p-6 border-b border-gray-100">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 20V10" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 20V4" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 20V16" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">보고서 생성하기</h2>
      </div>

      <div className="bg-white">
        <div className="p-6 border-b border-gray-100" onClick={() => {}}>
          <label className="block text-sm font-bold text-gray-500 mb-3">분석지역</label>
           <input 
              type="text" 
              placeholder="행정동, 지하철역, 상호명 입력" 
              className="w-full text-lg text-gray-900 placeholder-gray-400 bg-transparent border-none p-0 focus:ring-0 font-medium"
              value={selectedRegion.name}
              onChange={handleRegionChange}
            />
        </div>

        <div className="p-6 border-b border-gray-100">
           <label className="block text-sm font-bold text-gray-500 mb-3">분석업종</label>
           <div className="mb-4">
             <input 
                type="text" 
                placeholder="업종 입력"
                readOnly
                className="w-full text-lg text-gray-900 placeholder-gray-400 bg-transparent border-none p-0 focus:ring-0 font-medium cursor-pointer"
                value={selectedIndustry?.name || ''}
             />
           </div>
           
           <div className="grid grid-cols-4 gap-2.5">
             {categories.map((cat) => (
                <button
                  key={cat.code}
                  onClick={() => setSelectedIndustry({ name: cat.name, code: cat.code })}
                  className={`h-14 rounded-xl border flex items-center justify-center text-[13px] font-medium transition-all ${
                    selectedIndustry?.code === cat.code 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                   {cat.name}
                </button>
             ))}
           </div>
        </div>
      </div>

      <div className="p-6 bg-white">
        <button
          onClick={handleSubmit}
          disabled={!isRegionSelected || !selectedIndustry}
          className={`w-full py-4 rounded-xl font-bold text-[16px] transition-all shadow-sm ${
             !isRegionSelected || !selectedIndustry
             ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
             : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-[0.98]'
          }`}
        >
          보고서 생성 (0/5)
        </button>
      </div>
    </div>
  );
}
