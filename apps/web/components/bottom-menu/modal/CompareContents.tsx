import { useState, useEffect } from 'react';
import PillButton from '../PillButton';
import { CompareRequest } from '../../../types/bottom-menu-types';
import { BiTargetLock } from 'react-icons/bi';
import { useMapStore } from '../../../stores/useMapStore';
import toast from 'react-hot-toast';
interface Props {
  onClose: () => void;
  targetA: string;
  targetB: string;
  propCodeA?: string;
  propCodeB?: string;
  changeTargetA: (value: string) => void;
  changeTargetB: (value: string) => void;
  onPickLocation: (target: 'A' | 'B') => void;
  onCompare: (data: CompareRequest) => void;
}

export default function CompareContents({
  onClose,
  targetA,
  targetB,
  propCodeA,
  propCodeB,
  changeTargetA,
  changeTargetB,
  onPickLocation,
  onCompare,
}: Props) {
  const { moveToLocation, clearMarkers } = useMapStore();
  
  // Region codes (to be passed to backend)
  const [codeA, setCodeA] = useState<string>('');
  const [codeB, setCodeB] = useState<string>('');

  // Sync with props (e.g. from Map Click)
  useEffect(() => {
      setCodeA(propCodeA || '');
  }, [propCodeA]);

  useEffect(() => {
      setCodeB(propCodeB || '');
  }, [propCodeB]);

  // Search candidates
  const [candidatesA, setCandidatesA] = useState<any[]>([]);
  const [candidatesB, setCandidatesB] = useState<any[]>([]);

  const handleCompare = () => {
    if (!targetA || !targetB) {
        toast.error('두 구역을 모두 선택해주세요.');
        return;
    }
    // Strict Validation: Codes must be present
    if (!codeA || !codeB) {
        toast.error('정확한 구역을 검색 후 선택하거나, 지도에서 선택해주세요.');
        return;
    }

    clearMarkers(); // 분석 시작 시 마커 제거
    // Pass codes if available, otherwise pass names (backend might handle names, but codes are safer)
    onCompare({ 
        targetA: codeA || targetA, 
        targetB: codeB || targetB,
        targetNameA: targetA,
        targetNameB: targetB
    });
  };

  const searchRegion = async (keyword: string, target: 'A' | 'B') => {
      if (!keyword.trim()) return;

      try {
          const res = await fetch(`http://localhost:4000/analysis/search?query=${encodeURIComponent(keyword)}`);
          if (!res.ok) throw new Error('Search failed');
          const data = await res.json();

          if (data && data.length > 0) {
              if (target === 'A') setCandidatesA(data);
              else setCandidatesB(data);
          } else {
              toast.error('검색 결과가 없습니다.');
              if (target === 'A') setCandidatesA([]);
              else setCandidatesB([]);
          }
      } catch (err) {
          console.error(err);
          toast.error('지역 검색 중 오류가 발생했습니다.');
      }
  };

  const selectCandidate = (item: any, target: 'A' | 'B') => {
      const displayName = item.fullName || item.name;
      if (target === 'A') {
          changeTargetA(displayName);
          setCodeA(item.code);
          setCandidatesA([]);
      } else {
          changeTargetB(displayName);
          setCodeB(item.code);
          setCandidatesB([]);
      }
  };

  // UI for Dropdown
  const renderDropdown = (candidates: any[], target: 'A' | 'B') => {
      if (!candidates || candidates.length === 0) return null;
      return (
          <ul className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-50">
              {candidates.map((item) => (
                  <li 
                    key={`${item.type}-${item.code}`}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
                    onClick={() => selectCandidate(item, target)}
                  >
                      <span className="text-gray-900 font-medium">{item.fullName || item.name}</span>
                  </li>
              ))}
          </ul>
      );
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">비교</h3>
        <PillButton label="닫기" onClick={onClose}></PillButton>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        비교할 두 영역을 클릭하거나, 아래 입력창에서 구/동 단위를 검색하여 선택하세요.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {/* Location A */}
        <div className="relative flex gap-2 w-full">
          <div className="relative flex-1">
            <input
                className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                type="text"
                placeholder="첫 번째 구역 (예: 한남동)"
                value={targetA}
                onChange={(e) => {
                    changeTargetA(e.target.value);
                    setCodeA(''); // Reset code on edit
                    setCandidatesA([]); // Hide dropdown on edit
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        searchRegion(e.currentTarget.value, 'A');
                    }
                }}
            />
            {renderDropdown(candidatesA, 'A')}
          </div>
          <button
            onClick={() => onPickLocation('A')}
            className="flex items-center justify-center w-[120px] shrink-0 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            title="지도에서 선택"
          >
            <BiTargetLock size={18} />
            <p className="ml-1 text-sm">지도선택</p>
          </button>
        </div>

        {/* Location B */}
        <div className="relative flex gap-2 w-full">
          <div className="relative flex-1">
             <input
                className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                type="text"
                placeholder="두 번째 구역 (예: 삼성동)"
                value={targetB}
                onChange={(e) => {
                    changeTargetB(e.target.value);
                    setCodeB('');
                    setCandidatesB([]);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        searchRegion(e.currentTarget.value, 'B');
                    }
                }}
            />
            {renderDropdown(candidatesB, 'B')}
          </div>
          <button
            onClick={() => onPickLocation('B')}
            className="flex items-center justify-center w-[120px] shrink-0 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            title="지도에서 선택"
          >
            <BiTargetLock size={18} />
            <p className="ml-1 text-sm">지도선택</p>
          </button>
        </div>
      </div>
      <button
        onClick={handleCompare}
        className="mt-6 w-full rounded-xl border bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 cursor-pointer shadow-md"
      >
        분석 시작하기
      </button>
    </section>
  );
}
