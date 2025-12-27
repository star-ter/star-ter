import PillButton from '../PillButton';
import { CompareRequest } from '../../../types/bottom-menu-types';
import { BiTargetLock } from 'react-icons/bi';
import { useMapStore } from '../../../stores/useMapStore';

interface Props {
  onClose: () => void;
  targetA: string;
  targetB: string;
  changeTargetA: (value: string) => void;
  changeTargetB: (value: string) => void;
  onPickLocation: (target: 'A' | 'B') => void;
  onCompare: (data: CompareRequest) => void;
}

export default function CompareContents({
  onClose,
  targetA,
  targetB,
  changeTargetA,
  changeTargetB,
  onPickLocation,
  onCompare,
}: Props) {
  const { moveToLocation, clearMarkers } = useMapStore();

  const handleCompare = () => {
    if (!targetA || !targetB) return;
    clearMarkers(); // 분석 시작 시 마커 제거
    onCompare({ targetA, targetB });
  };

  const handleSearch = (keyword: string) => {
    if (!keyword.trim()) return;

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      console.error('Kakao Maps SDK not loaded');
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    geocoder.addressSearch(keyword, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = {
          lat: Number(result[0].y),
          lng: Number(result[0].x),
        };
        // 지도 이동 (중앙 정렬)
        moveToLocation(coords, keyword, 3, true);
      } else {
        alert('검색 결과를 찾을 수 없습니다.');
      }
    });
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
            placeholder="첫번 째 구역을 입력한 후 Enter"
            value={targetA}
            onChange={(e) => changeTargetA(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e.currentTarget.value);
              }
            }}
          />
          <button
            onClick={() => onPickLocation('A')}
            className="flex items-center justify-center w-[200px] rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            title="지도에서 선택"
          >
            <BiTargetLock size={18} />
            <p className="ml-2 text-sm">지도에서 선택</p>
          </button>
        </div>
        <div className="location-2 flex gap-2">
          <input
            className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            type="text"
            placeholder="두번 째 구역을 입력한 후 Enter"
            value={targetB}
            onChange={(e) => changeTargetB(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e.currentTarget.value);
              }
            }}
          />
          <button
            onClick={() => onPickLocation('B')}
            className="flex items-center justify-center w-[200px] rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
            title="지도에서 선택"
          >
            <BiTargetLock size={18} />
            <p className="ml-2 text-sm">지도에서 선택</p>
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
