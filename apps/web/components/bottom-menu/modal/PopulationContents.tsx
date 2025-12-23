export default function PopulationContents({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">유동인구</h3>
        <button
          className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-100"
          type="button"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        사용자가 현재 보고있는 지도의 지역, 검색한 지역에 따라 달라집니다.
      </p>

      <button className="mt-4 w-full rounded-xl border bg-gray-900 px-4 py-2 text-sm text-white transition hover:bg-gray-800">
        유동인구 보기
      </button>
    </section>
  );
}
