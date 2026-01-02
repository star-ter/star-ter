import { useState, useRef } from 'react';
import { ReportRequest } from '../../../types/bottom-menu-types';

interface ReportInputViewProps {
  onCreateReport: (data: ReportRequest) => void;
  initialRegion?: { name: string; code: string };
}

export default function ReportInputView({
  onCreateReport,
  initialRegion
}: ReportInputViewProps) {
  const [selectedRegion, setSelectedRegion] = useState(
    initialRegion || { name: '', code: '' }
  );
  const [selectedIndustry, setSelectedIndustry] = useState<{
    name: string;
    code: string;
  } | null>(null);

  const [regionSuggestions, setRegionSuggestions] = useState<{name: string, code: string}[]>([]);
  const [isRegionFocused, setIsRegionFocused] = useState(false);
  const isRegionSelected = !!selectedRegion.name; 

  const regionTimeout = useRef<NodeJS.Timeout | null>(null);
  const industryTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchRegions = async (query: string) => {
    if (!query) {
      setRegionSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/analysis/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRegionSuggestions(data.map((item: { fullName: string; name: string; code: string }) => ({
        name: item.fullName || item.name,
        code: item.code
      })));
    } catch (err) {
      console.error("Region fetch error:", err);
    }
  };

  const fetchIndustries = async (query: string) => {
    if (!query) {
      setIndustrySuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/analysis/search/industry?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setIndustrySuggestions(data);
    } catch (err) {
      console.error("Industry fetch error:", err);
    }
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSelectedRegion({ ...selectedRegion, name: val });
      
      if (regionTimeout.current) clearTimeout(regionTimeout.current);
      regionTimeout.current = setTimeout(() => fetchRegions(val), 300);
  }

  const [industrySuggestions, setIndustrySuggestions] = useState<{name: string, code: string}[]>([]);
  const [isIndustryFocused, setIsIndustryFocused] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');

  const handleIndustryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setIndustrySearch(val);
      
      if (industryTimeout.current) clearTimeout(industryTimeout.current);
      industryTimeout.current = setTimeout(() => fetchIndustries(val), 300);
  };

  const handleRegionSelect = (item: {name: string, code: string}) => {
      setSelectedRegion(item);
      setRegionSuggestions([]);
      setIsRegionFocused(false); 
  };

  const handleIndustrySelect = (item: {name: string, code: string}) => {
      setSelectedIndustry(item);
      setIndustrySearch(item.name);
      setIndustrySuggestions([]);
      setIsIndustryFocused(false);
  };

  const handleSubmit = () => {
    if (selectedRegion.name && selectedIndustry) {
      onCreateReport({
        regionCode: selectedRegion.code,
        regionName: selectedRegion.name,
        industryCode: selectedIndustry.code,
        industryName: selectedIndustry.name
      });
    }
  };

  return (
    <div className="w-[320px] flex flex-col font-sans">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        </div>
        <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">보고서 생성하기</h2>
      </div>

      <div className="space-y-5 mb-6">
        <div className="relative z-20">
          <label className="block text-[13px] font-bold text-gray-600 mb-1">분석지역</label>
           <div className="border-b border-gray-100 pb-1">
            <input 
                type="text" 
                placeholder="행정동, 지하철역, 상호명 입력" 
                className="w-full text-[15px] text-gray-900 placeholder-gray-400 bg-transparent border-none p-0 focus:ring-0 font-bold"
                value={selectedRegion.name}
                onChange={handleRegionChange}
                onFocus={() => setIsRegionFocused(true)}
                onBlur={() => setTimeout(() => setIsRegionFocused(false), 200)}
              />
           </div>
           {isRegionFocused && regionSuggestions.length > 0 && (
             <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-40 overflow-y-auto z-30">
               {regionSuggestions.map((item, idx) => (
                 <li 
                   key={idx}
                   className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] text-gray-700 font-medium"
                   onClick={() => handleRegionSelect(item)}
                 >
                   {item.name}
                 </li>
               ))}
             </ul>
           )}
        </div>

        <div className="relative z-10">
           <label className="block text-[13px] font-bold text-gray-600 mb-1">분석업종</label>
           <div className="border-b border-gray-100 pb-1">
             <input 
                type="text" 
                placeholder="업종 입력 (예: 커피)"
                className="w-full text-[15px] text-gray-900 placeholder-gray-400 bg-transparent border-none p-0 focus:ring-0 font-bold cursor-pointer"
                value={industrySearch}
                onChange={handleIndustryChange}
                onFocus={() => setIsIndustryFocused(true)}
                onBlur={() => setTimeout(() => setIsIndustryFocused(false), 200)}
             />
           </div>
           {isIndustryFocused && industrySuggestions.length > 0 && (
             <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-40 overflow-y-auto z-30">
               {industrySuggestions.map((item, idx) => (
                 <li 
                   key={idx}
                   className="px-3 py-2.5 hover:bg-blue-50 cursor-pointer text-[13px] text-gray-700 font-medium"
                   onClick={() => handleIndustrySelect(item)}
                 >
                   {item.name}
                 </li>
               ))}
             </ul>
           )}
        </div>
      </div>

      <div>
        <button
          onClick={handleSubmit}
          disabled={!isRegionSelected || !selectedIndustry}
          className={`w-full py-2.5 rounded-lg font-bold text-[14px] transition-all shadow-sm mb-2 ${
             !isRegionSelected || !selectedIndustry
             ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
             : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-[0.98]'
          }`}
        >
          보고서 생성 (0/5)
        </button>
        <p className="text-center text-[12px] text-gray-400 tracking-tight">
           매일 최대 5회, 보고서를 <span className="text-blue-600 font-bold cursor-pointer hover:underline">무료로 생성</span> 해보세요.
        </p>
      </div>
    </div>
  );
}
