import { ComparisonResponse } from '../../services/commercial-area/types';
import { formatNumber, formatCurrency, formatPercentage } from '../../utils/comparison-utils';

interface ComparisonViewProps {
  data: ComparisonResponse;
}

export function ComparisonView({ data }: ComparisonViewProps) {
  const { area1, area2, diff } = data.comparison;

  return (
    <div className="space-y-6">
      {/* 기본 정보 헤더 */}
      <div className="grid grid-cols-2 gap-4">
        <AreaHeader areaName={area1.areaName} />
        <AreaHeader areaName={area2.areaName} />
      </div>

      {/* 점포수 비교 */}
      <ComparisonSection title="점포수">
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="상권 1"
            value={formatNumber(area1.stores.total)}
            subtext="개"
          />
          <MetricCard
            label="상권 2"
            value={formatNumber(area2.stores.total)}
            subtext="개"
          />
          <DiffCard
            total={diff.stores.total}
            percentage={diff.stores.percentage}
          />
        </div>
      </ComparisonSection>

      {/* 매출 비교 */}
      <ComparisonSection title="매출">
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="상권 1"
            value={formatCurrency(area1.sales.total)}
          />
          <MetricCard
            label="상권 2"
            value={formatCurrency(area2.sales.total)}
          />
          <DiffCard
            total={diff.sales.total}
            percentage={diff.sales.percentage}
            isCurrency
          />
        </div>
      </ComparisonSection>

      {/* 유동인구 비교 */}
      <ComparisonSection title="유동인구">
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="상권 1"
            value={formatNumber(area1.floatingPopulation.total)}
            subtext="명"
          />
          <MetricCard
            label="상권 2"
            value={formatNumber(area2.floatingPopulation.total)}
            subtext="명"
          />
          <DiffCard
            total={diff.floatingPopulation.total}
            percentage={diff.floatingPopulation.percentage}
          />
        </div>
      </ComparisonSection>

      {/* 주거인구 비교 */}
      <ComparisonSection title="주거인구">
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="상권 1"
            value={formatNumber(area1.residentialPopulation.total)}
            subtext="명"
          />
          <MetricCard
            label="상권 2"
            value={formatNumber(area2.residentialPopulation.total)}
            subtext="명"
          />
          <DiffCard
            total={diff.residentialPopulation.total}
            percentage={diff.residentialPopulation.percentage}
          />
        </div>
      </ComparisonSection>

      {/* TODO: 상세 차트 추가 */}
      {/* <ComparisonChart data={data} /> */}
    </div>
  );
}

function AreaHeader({ areaName }: { areaName: string }) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-bold text-blue-900">{areaName}</h3>
    </div>
  );
}

function ComparisonSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h4 className="text-md font-semibold mb-4 text-gray-700">{title}</h4>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="text-center p-4 bg-gray-50 rounded">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
}

function DiffCard({
  total,
  percentage,
  isCurrency = false,
}: {
  total: number;
  percentage: number;
  isCurrency?: boolean;
}) {
  const isPositive = total > 0;
  const isNeutral = total === 0;

  const colorClass = isNeutral
    ? 'text-gray-600'
    : isPositive
      ? 'text-green-600'
      : 'text-red-600';

  const bgClass = isNeutral
    ? 'bg-gray-50'
    : isPositive
      ? 'bg-green-50'
      : 'bg-red-50';

  const displayValue = isCurrency
    ? formatCurrency(Math.abs(total))
    : formatNumber(Math.abs(total));

  return (
    <div className={`text-center p-4 ${bgClass} rounded`}>
      <div className="text-xs text-gray-500 mb-1">차이</div>
      <div className={`text-xl font-bold ${colorClass}`}>
        {isNeutral ? '동일' : `${isPositive ? '+' : '-'}${displayValue}`}
      </div>
      {!isNeutral && (
        <div className={`text-sm ${colorClass} mt-1`}>
          ({formatPercentage(percentage)})
        </div>
      )}
    </div>
  );
}
