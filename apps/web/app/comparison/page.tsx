'use client';

import { useState } from 'react';
import Kakaomap from '../../components/kakaomap';
import { ComparisonView } from '../../components/comparison/ComparisonView';
import { MapSelectionMode } from '../../types/map-selection-types';
import { commercialAreaService } from '../../services/commercial-area/commercial-area.service';
import { ComparisonResponse } from '../../services/commercial-area/types';

export default function ComparisonPage() {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [comparisonData, setComparisonData] =
    useState<ComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 지도 다중 선택 모드 설정
  const selectionMode: MapSelectionMode = {
    enabled: true,
    maxSelections: 2,
    selectedCodes: selectedAreas,
    onSelectionChange: (codes) => {
      setSelectedAreas(codes);
      // 선택이 변경되면 기존 비교 결과 초기화
      setComparisonData(null);
      setError(null);
    },
  };

  /**
   * 비교하기 버튼 클릭 핸들러
   */
  const handleCompare = async () => {
    if (selectedAreas.length !== 2) {
      setError('정확히 2개의 상권을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await commercialAreaService.compareAreas({
        areaCode1: selectedAreas[0],
        areaCode2: selectedAreas[1],
      });

      setComparisonData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '비교 중 오류가 발생했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 선택 초기화
   */
  const handleReset = () => {
    setSelectedAreas([]);
    setComparisonData(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 헤더 */}
      <div className="bg-white shadow-md p-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">상권 비교</h1>

          <div className="flex items-center gap-4">
            {/* 선택된 상권 표시 */}
            <div className="text-sm text-gray-600">
              선택된 상권: {selectedAreas.length} / 2
            </div>

            {/* 버튼들 */}
            <button
              onClick={handleReset}
              disabled={selectedAreas.length === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              초기화
            </button>

            <button
              onClick={handleCompare}
              disabled={selectedAreas.length !== 2 || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '비교 중...' : '비교하기'}
            </button>
          </div>
        </div>

        {/* 선택된 상권 상세 정보 */}
        {selectedAreas.length > 0 && (
          <div className="max-w-7xl mx-auto mt-4">
            <div className="flex gap-4">
              {selectedAreas.map((code, index) => (
                <div
                  key={code}
                  className="flex-1 bg-blue-50 p-3 rounded-md flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs text-blue-600 font-semibold">
                      상권 {index + 1}
                    </div>
                    <div className="text-sm text-gray-800">{code}</div>
                  </div>
                  <button
                    onClick={() =>
                      setSelectedAreas(
                        selectedAreas.filter((c) => c !== code),
                      )
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="max-w-7xl mx-auto mt-4">
            <div className="bg-red-50 text-red-700 p-3 rounded-md">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 지도 영역 */}
        <div className={comparisonData ? 'w-1/2' : 'w-full'}>
          <Kakaomap selectionMode={selectionMode} />
        </div>

        {/* 비교 결과 영역 */}
        {comparisonData && (
          <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">비교 결과</h2>
            <ComparisonView data={comparisonData} />
          </div>
        )}
      </div>
    </div>
  );
}
