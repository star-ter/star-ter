"use client";

import {
  RevenueChart,
  SurvivalGauge,
  BreakEvenCard,
  ListingsCard,
  SimilarAreasCard,
} from "./index";
import { type ChartItem } from "./types";

/**
 * ChartRenderer - 이미 처리된 차트 데이터를 렌더링
 *
 * ChatMessage 내부에서 사용되며, 말풍선 UI와 조화롭게 표시
 */

interface ChartRendererProps {
  items?: ChartItem[];
  className?: string;
}

export function ChartRenderer({ items, className }: ChartRendererProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`mt-4 space-y-4 ${className || ""}`}>
      {items.map((item) => (
        <ChartItemView key={item.id} item={item} />
      ))}
    </div>
  );
}

function ChartItemView({ item }: { item: ChartItem }) {
  if (item.error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-600 text-caption">
        ⚠️ {item.error}
      </div>
    );
  }

  switch (item.type) {
    case "chart.revenue":
      return (
        <RevenueChart
          data={
            item.data as Parameters<typeof RevenueChart>[0]["data"]
          }
          isLoading={item.isLoading}
          areaName={item.payload.areaName || undefined}
        />
      );

    case "chart.survival":
      return (
        <SurvivalGauge
          data={
            item.data as Parameters<typeof SurvivalGauge>[0]["data"]
          }
          isLoading={item.isLoading}
          areaName={item.payload.areaName || undefined}
        />
      );

    case "chart.breakeven":
      return (
        <BreakEvenCard
          data={
            item.data as Parameters<typeof BreakEvenCard>[0]["data"]
          }
          isLoading={item.isLoading}
          listingId={item.payload.listingId || undefined}
        />
      );

    case "list.listings":
      return (
        <ListingsCard
          data={
            item.data as Parameters<typeof ListingsCard>[0]["data"]
          }
          isLoading={item.isLoading}
          areaName={item.payload.areaName || undefined}
        />
      );

    case "list.similar_areas":
      return (
        <SimilarAreasCard
          data={
            item.data as Parameters<typeof SimilarAreasCard>[0]["data"]
          }
          isLoading={item.isLoading}
        />
      );

    default:
      console.warn(`[ChartRenderer] Unknown chart type: ${item.type}`);
      return null;
  }
}
