export default function AreaContents({ onClose }: { onClose: () => void }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">영역 지정</h3>
        <button
          className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-100"
          type="button"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        영역은 항상 1개만 유지 됩니다. (새로 그리면 기존 영역 삭제)
      </p>
    </section>
  );
}
