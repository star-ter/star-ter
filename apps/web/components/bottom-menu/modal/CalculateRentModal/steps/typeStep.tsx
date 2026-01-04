interface TypeStepProps {
  value: string;
  onChange: (type: string) => void;
  options: {
    small: number | null;
    mediumLarge: number | null;
    aggregate: number | null;
  } | null;
}

export const TYPES = [
  { label: '소규모 상가', value: 'small', desc: 'm²당 임대료' },
  { label: '중대형 상가', value: 'mediumLarge', desc: 'm²당 임대료' },
  {
    label: '집합 상가',
    value: 'aggregate',
    desc: '데이터가 부족하여 선택할 수 없어요.',
  },
];

export default function TypeStep({ value, onChange, options }: TypeStepProps) {
  const getPriceDisplay = (typeValue: string) => {
    if (!options) return null;
    const val = options[typeValue as keyof typeof options];
    if (val === null) return null;

    // 1000 KRW/Pyeong -> Won/m2
    const pricePerMeter = (val * 1000) / 3.3058;
    return Math.round(pricePerMeter);
  };

  const formatCurrency = (amount: number) => {
    // 10000 -> 1만
    const man = Math.floor(amount / 10000);
    const remainder = Math.floor(amount % 10000);
    return `${man > 0 ? `${man}만 ` : ''}${remainder > 0 ? `${remainder.toLocaleString()}` : ''}원`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xl font-bold">
        <span className="text-blue-600">매장이 어떤 건물</span>에 있는 걸
        생각하시는지 알려주세요.
      </div>
      <p className="text-sm text-gray-500">
        앞서 선택하신 {options ? '지역, 층이' : ''} 반영된 임대료입니다
      </p>

      <div className="flex flex-col gap-3 mt-4">
        {TYPES.map((item) => {
          const price = getPriceDisplay(item.value);
          const isDisabled = price === null;

          return (
            <button
              key={item.value}
              disabled={isDisabled}
              className={`flex items-center justify-between p-5 rounded-xl border text-left transition-all
                    ${
                      isDisabled
                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-70'
                        : value === item.value
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    `}
              onClick={() => !isDisabled && onChange(item.value)}
            >
              <div className="w-full">
                <div className="flex justify-between items-start w-full">
                  <div
                    className={`font-bold text-lg ${value === item.value ? 'text-blue-600' : 'text-gray-900'}`}
                  >
                    {item.label}
                  </div>
                  {!isDisabled && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500 m-0 p-0">
                        m²당 임대료
                      </div>
                      <div className="font-bold text-lg">
                        {formatCurrency(price!)}
                      </div>
                    </div>
                  )}
                </div>

                {isDisabled && (
                  <div className="text-sm text-gray-500 mt-2">
                    해당 유형에 대한 데이터가 부족하여 선택할 수 없어요.
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
