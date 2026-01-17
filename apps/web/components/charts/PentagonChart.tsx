'use client';

import { useMemo } from 'react';

interface MetricData {
  label: string;
  value: number; // 0-100
}

interface PentagonChartProps {
  metrics: MetricData[];
  size?: number;
  color?: string;
}

export function PentagonChart({
  metrics,
  size = 120,
  color = '#3b82f6',
}: PentagonChartProps) {
  // 최대 5개 메트릭만 사용
  const data = useMemo(() => {
    const paddedMetrics = [...metrics];
    // 5개 미만이면 빈 메트릭 추가
    while (paddedMetrics.length < 5) {
      paddedMetrics.push({ label: '', value: 0 });
    }
    return paddedMetrics.slice(0, 5);
  }, [metrics]);

  const center = size / 2;
  const maxRadius = (size / 2) * 0.7; // 라벨 공간 확보

  // 5각형 꼭짓점 계산 (위쪽 시작, 시계방향)
  const getPoint = (index: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  // 배경 5각형 (100% 기준선)
  const bgPoints = Array.from({ length: 5 }, (_, i) => {
    const p = getPoint(i, maxRadius);
    return `${p.x},${p.y}`;
  }).join(' ');

  // 50% 기준선
  const midPoints = Array.from({ length: 5 }, (_, i) => {
    const p = getPoint(i, maxRadius * 0.5);
    return `${p.x},${p.y}`;
  }).join(' ');

  // 데이터 영역
  const dataPoints = data
    .map((item, i) => {
      const radius = (item.value / 100) * maxRadius;
      const p = getPoint(i, Math.max(radius, maxRadius * 0.08));
      return `${p.x},${p.y}`;
    })
    .join(' ');

  // 라벨 위치
  const labelPositions = data.map((item, i) => {
    const p = getPoint(i, maxRadius + 14);
    return { ...p, label: item.label, value: item.value };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 배경 5각형 */}
        <polygon
          points={bgPoints}
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
        />

        {/* 50% 기준선 */}
        <polygon
          points={midPoints}
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        {/* 중심에서 꼭짓점으로 선 */}
        {Array.from({ length: 5 }, (_, i) => {
          const p = getPoint(i, maxRadius);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="var(--border)"
              strokeWidth="1"
            />
          );
        })}

        {/* 데이터 영역 */}
        <polygon
          points={dataPoints}
          fill={color}
          fillOpacity="0.25"
          stroke={color}
          strokeWidth="2"
        />

        {/* 데이터 포인트 */}
        {data.map((item, i) => {
          const radius = (item.value / 100) * maxRadius;
          const p = getPoint(i, Math.max(radius, maxRadius * 0.08));
          return <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />;
        })}
      </svg>

      {/* 라벨 */}
      {labelPositions.map((pos, i) => {
        if (!pos.label) return null;

        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
        let xOffset = 0;

        if (i === 0) {
          textAnchor = 'middle';
        } else if (i === 1 || i === 2) {
          textAnchor = 'start';
          xOffset = 2;
        } else {
          textAnchor = 'end';
          xOffset = -2;
        }

        return (
          <div
            key={i}
            className="absolute text-tiny font-strong text-muted-foreground whitespace-nowrap"
            style={{
              left: pos.x + xOffset,
              top: pos.y,
              transform: `translate(${textAnchor === 'start' ? '0%' : textAnchor === 'end' ? '-100%' : '-50%'}, -50%)`,
            }}
          >
            {pos.label}
          </div>
        );
      })}
    </div>
  );
}
