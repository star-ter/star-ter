import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import PillButton from '../PillButton';
import LocationInput from './LocationInput';
import { useMapStore } from '../../../stores/useMapStore';
import { API_ENDPOINTS } from '../../../config/api';
import {
  CompareContentsProps,
  RegionCandidate,
  LocationTarget,
} from '../../../types/compare-types';

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
}: CompareContentsProps) {
  const { clearMarkers } = useMapStore();

  const [codeA, setCodeA] = useState<string>('');
  const [codeB, setCodeB] = useState<string>('');
  const [candidatesA, setCandidatesA] = useState<RegionCandidate[]>([]);
  const [candidatesB, setCandidatesB] = useState<RegionCandidate[]>([]);

  useEffect(() => {
    setCodeA(propCodeA || '');
  }, [propCodeA]);

  useEffect(() => {
    setCodeB(propCodeB || '');
  }, [propCodeB]);

  const searchRegion = useCallback(
    async (keyword: string, target: LocationTarget) => {
      if (!keyword.trim()) return;

      try {
        const res = await fetch(
          `${API_ENDPOINTS.ANALYSIS_SEARCH}?query=${encodeURIComponent(keyword)}`
        );
        if (!res.ok) throw new Error('Search failed');
        const data: RegionCandidate[] = await res.json();

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
    },
    []
  );

  const handleChangeA = useCallback(
    (value: string) => {
      changeTargetA(value);
      setCodeA('');
      setCandidatesA([]);
    },
    [changeTargetA]
  );

  const handleChangeB = useCallback(
    (value: string) => {
      changeTargetB(value);
      setCodeB('');
      setCandidatesB([]);
    },
    [changeTargetB]
  );

  const handleSelectA = useCallback(
    (item: RegionCandidate) => {
      const displayName = item.fullName || item.name;
      changeTargetA(displayName);
      setCodeA(item.code);
      setCandidatesA([]);
    },
    [changeTargetA]
  );

  const handleSelectB = useCallback(
    (item: RegionCandidate) => {
      const displayName = item.fullName || item.name;
      changeTargetB(displayName);
      setCodeB(item.code);
      setCandidatesB([]);
    },
    [changeTargetB]
  );

  const handleSearchA = useCallback(
    (keyword: string) => searchRegion(keyword, 'A'),
    [searchRegion]
  );

  const handleSearchB = useCallback(
    (keyword: string) => searchRegion(keyword, 'B'),
    [searchRegion]
  );

  const handlePickA = useCallback(() => onPickLocation('A'), [onPickLocation]);
  const handlePickB = useCallback(() => onPickLocation('B'), [onPickLocation]);

  const handleCompare = useCallback(() => {
    if (!targetA || !targetB) {
      toast.error('두 구역을 모두 선택해주세요.');
      return;
    }
    if (!codeA || !codeB) {
      toast.error('정확한 구역을 검색 후 선택하거나, 지도에서 선택해주세요.');
      return;
    }

    clearMarkers();
    onCompare({
      targetA: codeA || targetA,
      targetB: codeB || targetB,
      targetNameA: targetA,
      targetNameB: targetB,
    });
  }, [targetA, targetB, codeA, codeB, clearMarkers, onCompare]);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">비교</h3>
        <PillButton label="닫기" onClick={onClose} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        비교할 두 영역을 클릭하거나, 아래 입력창에서 구/동 단위를 검색하여
        선택하세요.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <LocationInput
          value={targetA}
          placeholder="첫 번째 구역 (예: 한남동)"
          candidates={candidatesA}
          onChange={handleChangeA}
          onSearch={handleSearchA}
          onSelect={handleSelectA}
          onPickFromMap={handlePickA}
        />

        <LocationInput
          value={targetB}
          placeholder="두 번째 구역 (예: 삼성동)"
          candidates={candidatesB}
          onChange={handleChangeB}
          onSearch={handleSearchB}
          onSelect={handleSelectB}
          onPickFromMap={handlePickB}
        />
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
