import PillButton from '../PillButton';

export default function PopulationContents({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">유동인구</h3>
        <PillButton label="닫기" onClick={onClose}></PillButton>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        사용자가 현재 보고있는 지도의 지역, 검색한 지역에 따라 달라집니다.
      </p>

      <button className="mt-4 w-full rounded-xl border bg-gray-900 px-4 py-2 text-sm text-white transition hover:bg-gray-800 cursor-pointer">
        유동인구 보기
      </button>
    </section>
  );
}
