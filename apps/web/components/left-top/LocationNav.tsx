import { useLocationSync } from '@/hooks/useLocationSync';
import ModeController from './ModeController';

const Separator = () => (
  <svg
    className="mx-1 h-4 w-4 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 5l7 7-7 7"
    />
  </svg>
);

export default function LocationNav() {
  const {
    guList,
    dongList,
    selectedGu,
    selectedDong,
    isLoadingGu,
    isLoadingDong,
    isSyncing,
    changeGu,
    changeDong,
  } = useLocationSync();

  const labelClass =
    'block px-1 text-[13px] font-medium text-gray-700 transition-all group-hover:text-gray-900 group-hover:font-bold cursor-pointer whitespace-nowrap';

  const selectOverlayClass =
    'absolute inset-0 h-full opacity-0 cursor-pointer disabled:cursor-not-allowed';

  const currentGuName =
    guList.find((g) => g.code === selectedGu)?.name ||
    (isLoadingGu ? '로딩 중...' : '구 선택');
  const currentDongName =
    dongList.find((d) => d.code === selectedDong)?.name ||
    (isLoadingDong ? '로딩 중...' : '동 선택');

  return (
    <div className="flex items-center gap-3 w-fit">
      {/* Location Selectors */}
      <div className="flex items-center rounded-full bg-white/90 px-5 py-1.5 shadow-sm">
        <div className="relative flex min-w-fit items-center group">
          <span className={labelClass}>서울특별시</span>
          <select name="city" defaultValue="11" className={selectOverlayClass}>
            <option value="11">서울특별시</option>
          </select>
        </div>

        <Separator />

        <div className="relative flex min-w-fit items-center group">
          <span
            className={`${labelClass} ${!selectedGu ? 'text-gray-400' : ''}`}
          >
            {currentGuName}
          </span>
          <select
            name="gu"
            value={selectedGu}
            onChange={(e) => changeGu(e.target.value)}
            disabled={!guList.length || isLoadingGu || isSyncing}
            className={selectOverlayClass}
          >
            <option value="">{isLoadingGu ? '로딩 중...' : '구 선택'}</option>
            {guList.map((gu) => (
              <option key={gu.code} value={gu.code}>
                {gu.name}
              </option>
            ))}
          </select>
        </div>

        <Separator />

        <div className="relative flex min-w-fit items-center group">
          <span
            className={`${labelClass} ${!selectedDong ? 'text-gray-400' : ''}`}
          >
            {currentDongName}
          </span>
          <select
            name="dong"
            value={selectedDong}
            onChange={(e) => changeDong(e.target.value)}
            disabled={
              !selectedGu || !dongList.length || isLoadingDong || isSyncing
            }
            className={selectOverlayClass}
          >
            <option value="">{isLoadingDong ? '로딩 중...' : '동 선택'}</option>
            {dongList.map((dong) => (
              <option key={dong.code} value={dong.code}>
                {dong.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Buttons */}
      <ModeController />
    </div>
  );
}
