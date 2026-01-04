import { RankItem } from '@/hooks/useRevenueRanking';

type RankNavItemProps = {
  item: RankItem;
  rank: number;
  onClick: () => void;
  disabled: boolean;
  formatAmount: (amount: number) => string;
};

const changeLabelMap: Record<string, string> = {
  HH: '정체 상권',
  LL: '변동 상권',
  HL: '위험 상권',
  LH: '뜨는 상권',
};

export default function RankNavItem({
  item,
  rank,
  onClick,
  disabled,
  formatAmount,
}: RankNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-gray-50/80 px-3 py-2 text-left transition hover:border-gray-200 hover:bg-white disabled:cursor-wait disabled:opacity-70"
      disabled={disabled}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
        {rank}
      </span>
      <div className="flex flex-1 items-center justify-between gap-4">
        <span className="text-sm font-semibold text-gray-900">{item.name}</span>
        <span className="text-sm font-bold text-gray-900">
          {formatAmount(item.amount)}
        </span>
      </div>
      <span
        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
          changeLabelMap[item.changeType || '']?.includes('뜨는')
            ? 'bg-blue-100 text-blue-700'
            : changeLabelMap[item.changeType || '']?.includes('위험')
              ? 'bg-red-100 text-red-700'
              : changeLabelMap[item.changeType || '']?.includes('확장') ||
                  changeLabelMap[item.changeType || '']?.includes('변동')
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-700'
        }`}
      >
        {changeLabelMap[item.changeType || ''] || '정보 없음'}
      </span>
    </button>
  );
}
