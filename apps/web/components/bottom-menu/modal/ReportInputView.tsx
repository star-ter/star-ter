import { useState, useRef } from 'react';
import { ReportRequest } from '../../../types/bottom-menu-types';
import { IndustryData } from '../../../mocks/industry';

interface ReportInputViewProps {
  onCreateReport: (data: ReportRequest) => void;
  initialRegion?: { name: string; code: string };
}

export default function ReportInputView({
  onCreateReport,
  initialRegion,
}: ReportInputViewProps) {
  const [selectedRegion, setSelectedRegion] = useState(
    initialRegion || { name: '', code: '' },
  );
  const [selectedIndustry, setSelectedIndustry] = useState<{
    name: string;
    code: string;
  } | null>(null);

  const [selectedMajorCode, setSelectedMajorCode] = useState<string | null>(
    null,
  );

  const [regionSuggestions, setRegionSuggestions] = useState<
    { name: string; code: string }[]
  >([]);
  const [isRegionFocused, setIsRegionFocused] = useState(false);
  const isRegionSelected = !!selectedRegion.name;

  const regionTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchRegions = async (query: string) => {
    if (!query) {
      setRegionSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/analysis/search?query=${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRegionSuggestions(
        data.map((item: { fullName: string; name: string; code: string }) => ({
          name: item.fullName || item.name,
          code: item.code,
        })),
      );
    } catch (err) {
      console.error('Region fetch error:', err);
    }
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedRegion({ ...selectedRegion, name: val });

    if (regionTimeout.current) clearTimeout(regionTimeout.current);
    regionTimeout.current = setTimeout(() => fetchRegions(val), 300);
  };

  const handleRegionSelect = (item: { name: string; code: string }) => {
    setSelectedRegion(item);
    setRegionSuggestions([]);
    setIsRegionFocused(false);
  };

  const [isMajorOpen, setIsMajorOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);

  const selectedMajor = IndustryData.find((m) => m.code === selectedMajorCode);

  const handleMajorSelect = (code: string) => {
    setSelectedMajorCode(code);
    setSelectedIndustry(null);
    setIsMajorOpen(false);
  };

  const handleSubSelect = (item: { name: string; code: string }) => {
    setSelectedIndustry(item);
    setIsSubOpen(false);
  };

  const handleSubmit = () => {
    if (selectedRegion.name && selectedIndustry) {
      onCreateReport({
        regionCode: selectedRegion.code,
        regionName: selectedRegion.name,
        industryCode: selectedIndustry.code,
        industryName: selectedIndustry.name,
      });
    }
  };

  return (
    <div className="w-[320px] flex flex-col font-sans">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <h2 className="text-[16px] font-bold text-gray-900 tracking-tight">
          보고서 생성하기
        </h2>
      </div>

      <div className="space-y-5 mb-6">
        <div className="relative z-30">
          <label className="block text-[13px] font-bold text-gray-600 mb-1">
            분석지역
          </label>
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
            <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-40 overflow-y-auto z-40">
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

        <div className="space-y-4 pt-2 border-t border-gray-50">
          <div className="relative">
            <label className="block text-[13px] font-bold text-gray-400 mb-1.5">
              업종 대분류
            </label>
            <button
              onClick={() => setIsMajorOpen(!isMajorOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                isMajorOpen
                  ? 'border-blue-400 bg-blue-50/30'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <span
                className={`text-[14px] font-bold ${selectedMajor ? 'text-gray-900' : 'text-gray-300'}`}
              >
                {selectedMajor ? selectedMajor.name : '대분류 선택'}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-gray-400 transition-transform ${isMajorOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isMajorOpen && (
              <ul className="absolute left-0 right-0 top-full mt-1 py-1 z-20 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {IndustryData.map((item) => (
                  <li
                    key={item.code}
                    onClick={() => handleMajorSelect(item.code)}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-[13px] font-semibold text-gray-700 hover:text-blue-600 border-l-[3px] border-transparent hover:border-blue-500 transition-all"
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative">
            <label className="block text-[13px] font-bold text-gray-400 mb-1.5">
              상세 업종
            </label>
            <button
              disabled={!selectedMajor}
              onClick={() => setIsSubOpen(!isSubOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                !selectedMajor
                  ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                  : isSubOpen
                    ? 'border-blue-400 bg-blue-50/30'
                    : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <span
                className={`text-[14px] font-bold ${selectedIndustry ? 'text-gray-900' : 'text-gray-300'}`}
              >
                {selectedIndustry ? selectedIndustry.name : '세부업종 선택'}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-gray-400 transition-transform ${isSubOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {isSubOpen && selectedMajor && (
              <ul className="absolute left-0 right-0 top-full mt-1 py-1 z-20 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {selectedMajor.children?.map((child) => (
                  <li
                    key={child.code}
                    onClick={() =>
                      handleSubSelect({ name: child.name, code: child.code })
                    }
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-[13px] font-semibold text-gray-700 hover:text-blue-600 border-l-[3px] border-transparent hover:border-blue-500 transition-all"
                  >
                    {child.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <button
          onClick={handleSubmit}
          disabled={!isRegionSelected || !selectedIndustry}
          className={`w-full py-2.5 rounded-lg font-bold text-[14px] transition-all shadow-sm mb-2 ${
            !isRegionSelected || !selectedIndustry
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-[0.98]'
          }`}
        >
          보고서 생성
        </button>
      </div>
    </div>
  );
}
