import { useMapStore } from '@/stores/useMapStore';

export default function ModeController() {
  const { overlayMode, setOverlayMode } = useMapStore();

  const getButtonClass = (
    mode: 'revenue' | 'population' | 'opening' | 'shutting',
  ) =>
    `px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
      overlayMode === mode
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-transparent text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="flex items-center justify-center bg-white/90 rounded-full p-1 shadow-sm gap-1">
      <button
        onClick={() => setOverlayMode('revenue')}
        className={getButtonClass('revenue')}
      >
        매출
      </button>
      <button
        onClick={() => setOverlayMode('population')}
        className={getButtonClass('population')}
      >
        인구
      </button>
      <button
        onClick={() => setOverlayMode('opening')}
        className={getButtonClass('opening')}
      >
        개업
      </button>
      <button
        onClick={() => setOverlayMode('shutting')}
        className={getButtonClass('shutting')}
      >
        폐업
      </button>
    </div>
  );
}
