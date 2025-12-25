import PillButton from '../PillButton';
import { CompareRequest } from '../../../types/bottom-menu-types';
import { BiTargetLock } from 'react-icons/bi';

interface Props {
  onClose: () => void;
  targetA: string;
  targetB: string;
  onChangeTargetA: (value: string) => void;
  onChangeTargetB: (value: string) => void;
  onPickLocation: (target: 'A' | 'B') => void;
  onCompare: (data: CompareRequest) => void;
}

export default function CompareContents({
  onClose,
  targetA,
  targetB,
  onChangeTargetA,
  onChangeTargetB,
  onPickLocation,
  onCompare,
}: Props) {
  const handleCompare = () => {
    if (!targetA || !targetB) return;
    onCompare({ targetA, targetB });
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">비교</h3>
        <PillButton label="닫기" onClick={onClose}></PillButton>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        비교할 두 영역을 클릭해서 마커를 남기거나, 아래 입력창에 검색하세요.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <div className="location-1 flex gap-2">
          <input
            className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            type="text"
            placeholder="비교할 첫번 째 구역을 입력하세요."
            value={targetA}
            onChange={(e) => onChangeTargetA(e.target.value)}
          />
          <button
            onClick={() => onPickLocation('A')}
            className="flex items-center justify-center w-[46px] rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            title="지도에서 선택"
          >
            <BiTargetLock size={20} />
          </button>
        </div>
        <div className="location-2 flex gap-2">
          <input
            className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            type="text"
            placeholder="비교할 두번 째 구역을 입력하세요."
            value={targetB}
            onChange={(e) => onChangeTargetB(e.target.value)}
          />
          <button
            onClick={() => onPickLocation('B')}
            className="flex items-center justify-center w-[46px] rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            title="지도에서 선택"
          >
            <BiTargetLock size={20} />
          </button>
        </div>
      </div>
      <button
        onClick={handleCompare}
        className="mt-4 w-full rounded-xl border bg-gray-900 px-4 py-2 text-sm text-white transition hover:bg-gray-800 cursor-pointer"
      >
        두 구역 분석 비교
      </button>
    </section>
  );
}
