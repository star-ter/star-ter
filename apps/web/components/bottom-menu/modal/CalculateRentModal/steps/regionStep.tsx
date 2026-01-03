interface RegionStepProps {
  value: string;
  onChange: (region: string) => void;
}

const SEOUL_GU = [
  '강남구',
  '강동구',
  '강북구',
  '강서구',
  '관악구',
  '광진구',
  '구로구',
  '금천구',
  '노원구',
  '도봉구',
  '동대문구',
  '동작구',
  '마포구',
  '서대문구',
  '서초구',
  '성동구',
  '성북구',
  '송파구',
  '양천구',
  '영등포구',
  '용산구',
  '은평구',
  '종로구',
  '중구',
  '중랑구',
];

export default function RegionStep({ value, onChange }: RegionStepProps) {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="text-xl font-bold">
        <span className="text-blue-600">어느 지역구</span>에서 창업하시는지
        알려주세요.
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4 flex-1 overflow-y-auto min-h-0">
        {SEOUL_GU.map((gu) => (
          <button
            key={gu}
            className={`p-3 rounded-lg border text-left active:bg-blue-50 transition-colors
              ${value === gu ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 hover:border-gray-300'}
            `}
            onClick={() => onChange(gu)}
          >
            {gu}
          </button>
        ))}
      </div>
    </div>
  );
}
