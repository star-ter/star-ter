import React from 'react';
import { useRentCalculator } from '../../../../hooks/useRentCalculator';
import RegionStep from './steps/regionStep';
import SizeStep from './steps/sizeStep';
import FloorStep from './steps/floorStep';
import TypeStep from './steps/typeStep';
import ResultStep from './steps/resultStep';

interface CalculateRentContentsProps {
  onClose: () => void;
}

export default function CalculateRentContents({
  onClose,
}: CalculateRentContentsProps) {
  const {
    step,
    data,
    result,
    rentOptions,
    isLoading,
    nextStep,
    prevStep,
    updateData,
    fetchRentInfo,
    calculateRent,
  } = useRentCalculator();

  const handleNext = async () => {
    // Validation check before next
    if (step === 0 && !data.region) return; // Must select region
    if (step === 1 && !data.size) return; // Must select size
    if (step === 2 && !data.floor) return; // Must select floor

    // Fetch rent info before moving to Type step
    if (step === 2) {
      const success = await fetchRentInfo();
      if (!success) return; // Handle error or prevent next
    }

    if (step === 3 && !data.type) return; // Must select type

    nextStep();
  };

  const isNextDisabled = () => {
    if (step === 0 && !data.region) return true;
    if (step === 1 && !data.size) return true;
    if (step === 2 && !data.floor) return false; // Floor has default? or 0
    if (step === 3 && !data.type) return true;
    return false;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <RegionStep
            value={data.region}
            onChange={(val) => updateData({ region: val })}
          />
        );
      case 1:
        return (
          <SizeStep
            value={data.size}
            onChange={(val) => updateData({ size: val })}
          />
        );
      case 2:
        return (
          <FloorStep
            value={data.floor}
            onChange={(val) => updateData({ floor: val })}
          />
        );
      case 3:
        return (
          <TypeStep
            value={data.type}
            onChange={(val) => updateData({ type: val })}
            options={rentOptions}
          />
        );
      case 4:
        return (
          <ResultStep
            data={data}
            result={result}
            isLoading={isLoading}
            onCalculate={calculateRent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-180 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-185 max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-lg font-bold">외식업 창업 계산기</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      {/* Progress Bar */}
      {step < 4 && (
        <div className="w-full h-1 bg-gray-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {renderStep()}
      </div>

      {/* Footer Navigation */}
      {step < 4 && (
        <div className="p-6 border-t flex gap-3">
          {step > 0 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
            >
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isNextDisabled()}
            className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors
                    ${isNextDisabled() ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                `}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
