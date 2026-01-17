"use client";

import React, { useState, useEffect } from "react";
import { RevenueChart, SurvivalGauge, BreakEvenCard, ListingsCard, SimilarAreasCard } from "./index";

/**
 * ChartRenderer - 차트 액션을 받아 백엔드 API에서 데이터 fetch 후 렌더링
 * 
 * ChatMessage 내부에서 사용되며, 말풍선 UI와 조화롭게 표시
 */

export interface ChartAction {
  type: string;
  payload: {
    areaCode?: string | null;
    areaName?: string | null;
    industryCode?: string | null;
    listingId?: string | null;
    lat?: number | null;
    lng?: number | null;
    maxDeposit?: number | null;
    maxMonthlyRent?: number | null;
  };
}

interface ChartRendererProps {
  actions: ChartAction[];
  className?: string;
}

// API 베이스 URL (환경변수 또는 기본값)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export function ChartRenderer({ actions, className }: ChartRendererProps) {
  // 차트 타입 액션만 필터링
  const chartActions = actions.filter(
    (a) => a.type.startsWith("chart.") || a.type.startsWith("list.")
  );

  if (chartActions.length === 0) {
    return null;
  }

  return (
    <div className={`mt-4 space-y-4 ${className || ""}`}>
      {chartActions.map((action, index) => (
        <ChartItem key={`${action.type}-${index}`} action={action} />
      ))}
    </div>
  );
}

// 개별 차트 아이템 렌더링 (데이터 fetch 포함)
function ChartItem({ action }: { action: ChartAction }) {
  const { type, payload } = action;
  const [data, setData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let endpoint = '';
        const params = new URLSearchParams();

        if (payload.areaCode) params.set('areaCd', payload.areaCode);
        if (payload.industryCode) params.set('categoryCode', payload.industryCode);
        if (payload.listingId) params.set('listingId', payload.listingId);

        switch (type) {
          case 'chart.revenue':
            endpoint = `${API_BASE}/ai/chart/revenue`;
            break;
          case 'chart.survival':
            endpoint = `${API_BASE}/ai/chart/survival`;
            break;
          case 'chart.breakeven':
            endpoint = `${API_BASE}/ai/chart/breakeven`;
            break;
          case 'list.listings':
            endpoint = `${API_BASE}/ai/chart/listings`;
            // list.listings requires lat/lng
            if (payload.lat) params.set('latitude', String(payload.lat));
            if (payload.lng) params.set('longitude', String(payload.lng));
            if (payload.maxDeposit) params.set('maxDeposit', String(payload.maxDeposit));
            if (payload.maxMonthlyRent) params.set('maxMonthlyRent', String(payload.maxMonthlyRent));
            break;
          case 'list.similar_areas':
            endpoint = `${API_BASE}/ai/chart/similar-areas`;
            break;
          default:
            setIsLoading(false);
            return;
        }

        const response = await fetch(`${endpoint}?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError('데이터를 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('Chart data fetch error:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [type, payload.areaCode, payload.industryCode, payload.listingId, payload.lat, payload.lng, payload.maxDeposit, payload.maxMonthlyRent]);

  // 에러 상태
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-600 text-caption">
        ⚠️ {error}
      </div>
    );
  }

  // 차트 타입별 렌더링
  switch (type) {
    case "chart.revenue":
      return (
        <RevenueChart
          data={(data as unknown) as Parameters<typeof RevenueChart>[0]["data"]}
          isLoading={isLoading}
          areaName={payload.areaName || undefined}
        />
      );

    case "chart.survival":
      return (
        <SurvivalGauge
          data={(data as unknown) as Parameters<typeof SurvivalGauge>[0]["data"]}
          isLoading={isLoading}
          areaName={payload.areaName || undefined}
        />
      );

    case "chart.breakeven":
      return (
        <BreakEvenCard
          data={(data as unknown) as Parameters<typeof BreakEvenCard>[0]["data"]}
          isLoading={isLoading}
          listingId={payload.listingId || undefined}
        />
      );

    case "chart.competition":
      return (
        <div className="p-4 bg-slate-50 rounded-lg text-slate-500">
          📊 경쟁 분석 차트 (구현 예정)
        </div>
      );

    case "list.listings":
      return (
        <ListingsCard
          data={(data as unknown) as Parameters<typeof ListingsCard>[0]["data"]}
          isLoading={isLoading}
          areaName={payload.areaName || undefined}
        />
      );

    case "list.similar_areas":
      return (
        <SimilarAreasCard
          data={(data as unknown) as Parameters<typeof SimilarAreasCard>[0]["data"]}
          isLoading={isLoading}
        />
      );

    default:
      console.warn(`[ChartRenderer] Unknown chart type: ${type}`);
      return null;
  }
}
