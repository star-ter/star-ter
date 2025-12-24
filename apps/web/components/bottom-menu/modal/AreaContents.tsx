import PillButton from '../PillButton';

export default function AreaContents({ onClose }: { onClose: () => void }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">영역 지정</h3>
        <PillButton label="닫기" onClick={onClose}></PillButton>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        영역은 항상 1개만 유지 됩니다. (새로 그리면 기존 영역 삭제)
      </p>
    </section>
  );
}
