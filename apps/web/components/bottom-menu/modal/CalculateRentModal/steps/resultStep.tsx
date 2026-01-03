import { useEffect } from 'react';
import { RentResult, RentData } from '../../../../../hooks/useRentCalculator';
import { SIZES } from './sizeStep';
import { FLOORS } from './floorStep';
import { TYPES } from './typeStep';

interface ResultStepProps {
  data: RentData;
  result: RentResult | null;
  isLoading: boolean;
  onCalculate: () => void;
}

export default function ResultStep({
  data,
  result,
  isLoading,
  onCalculate,
}: ResultStepProps) {
  // Auto calculate on mount if not calculated
  useEffect(() => {
    if (!result && !isLoading) {
      onCalculate();
    }
  }, [result, isLoading, onCalculate]);

  const formatKoreanCurrency = (amount: number) => {
    if (amount === 0) return '0원';

    // 만원 단위로 반올림
    const roundedAmount = Math.round(amount / 10000) * 10000;

    // 억, 만 단위 계산
    const eok = Math.floor(roundedAmount / 100000000);
    const man = Math.floor((roundedAmount % 100000000) / 10000);

    let resultString = '';

    if (eok > 0) {
      resultString += `${eok}억 `;
    }

    if (man > 0) {
      resultString += `${man.toLocaleString()}만 `;
    }

    // 만원 미만은 표시 안함
    if (eok === 0 && man === 0) {
      // 만원 미만인 경우 원래 금액 표시
      return `${amount.toLocaleString()}원`;
    }

    return `${resultString.trim()}원`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-75">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500">임대료 정보를 분석하고 있습니다...</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="flex flex-col gap-6 h-full flex-1">
      {/* Top Banner Result */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shrink-0">
        <div className="flex items-center gap-2 mb-2">
          {/* Icon or Label */}
          <span className="font-bold border-2 border-white/30 rounded-full px-2 py-0.5 text-xs">
            STAR-TER 예상 창업 비용
          </span>
        </div>
        <div className="text-4xl font-bold mb-2">
          {result
            ? formatKoreanCurrency(result.deposit + result.monthlyRent)
            : '계산 중...'}
        </div>
        <div className="text-blue-100 text-sm mb-6">
          선택값을 반영해 계산한 예상 창업 비용이에요.
        </div>

        {/* Breakdown Table inside Banner */}
        <div className="flex flex-col gap-2 rounded-xl bg-blue-700/30 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-200">지역</span>
            <span className="font-medium">서울시 {data.region}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-200">면적</span>
            <span className="font-medium">
              {SIZES.find((s) => s.size === data.size)?.label ||
                `${data.size}m²`}{' '}
              ({Math.round(data.size / 3.3058)}평)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-200">층</span>
            <span className="font-medium">
              {FLOORS.find((f) => f.value === data.floor)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-200">건물 유형</span>
            <span className="font-medium">
              {TYPES.find((t) => t.value === data.type)?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Detail Section */}
      <div className="flex-1 overflow-y-auto px-1">
        {/* Helper Card */}
        <div className="bg-gray-50 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span>💡</span>
            <span className="font-bold">참고 도움말</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            <li>
              좋은 자리라면{' '}
              <span className="text-blue-600 font-medium">권리금이 추가</span>로
              발생할 수 있어요.
            </li>
            <li>실제 시세와는 차이가 있을 수 있어요.</li>
          </ul>
        </div>

        <h3 className="text-lg font-bold mb-4">예상 창업 비용 상세</h3>

        <div className="space-y-6">
          {/* Monthly Rent */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <div className="font-bold">첫 월 임대료</div>
              {result.pricePer3_3m2 !== undefined && (
                <div className="text-sm text-gray-400 mt-1">
                  {/* Unit price display */}
                  3.3m²당 {result.pricePer3_3m2.toLocaleString()}원
                </div>
              )}
            </div>
            <div className="text-blue-600 font-bold text-xl">
              {result ? formatKoreanCurrency(result.monthlyRent) : '-'}
            </div>
          </div>

          {/* Deposit */}
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <div className="font-bold">보증금</div>
              <div className="text-sm text-gray-400 mt-1">
                월 임대료 * 10개월 (가정)
              </div>
            </div>
            <div className="text-blue-600 font-bold text-xl">
              {result ? formatKoreanCurrency(result.deposit) : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
