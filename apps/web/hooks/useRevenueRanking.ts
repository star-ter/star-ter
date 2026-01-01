import { useState, useEffect } from 'react';
import { geocodeAddress } from '@/services/geocoding/geocoding.service';
import { useMapStore } from '@/stores/useMapStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type RankItem = {
  code: string;
  name: string;
  amount: number;
  count: number;
  changeType?: string;
};

type RevenueRankingResponse = {
  level: 'gu' | 'dong';
  industryCode?: string;
  items: RankItem[];
};

interface UseRevenueRankingProps {
  level: 'gu' | 'dong';
  parentGuCode?: string;
  industryCode?: string;
}

interface UseRevenueRankingReturn {
  items: RankItem[];
  isLoading: boolean;
  error: string | null;
  isMoving: boolean;
  handleSelect: (name: string) => Promise<void>;
  formatAmount: (amount: number) => string;
}

export const useRevenueRanking = ({
  level,
  parentGuCode,
  industryCode,
}: UseRevenueRankingProps): UseRevenueRankingReturn => {
  const { moveToLocation } = useMapStore();
  const [isMoving, setIsMoving] = useState(false);
  const [items, setItems] = useState<RankItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_BASE_URL) {
      setError('API_BASE_URL이 설정되지 않았습니다.');
      return;
    }

    const controller = new AbortController();
    const url = new URL(`${API_BASE_URL}/revenue/ranking`);
    url.searchParams.set('level', level);
    if (industryCode) url.searchParams.set('industryCode', industryCode);
    if (level === 'dong' && parentGuCode) {
      url.searchParams.set('parentGuCode', parentGuCode);
    }

    setIsLoading(true);
    setError(null);

    fetch(url.toString(), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('순위 데이터를 불러오지 못했습니다.');
        return res.json();
      })
      .then(async (data: RevenueRankingResponse) => {
        setItems(data.items || []);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError('순위 데이터를 불러오지 못했습니다.');
        setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [level, parentGuCode, industryCode]);

  const handleSelect = async (name: string) => {
    if (isMoving) return;
    setIsMoving(true);
    try {
      const result = await geocodeAddress(`서울특별시 ${name}`);
      if (result) {
        moveToLocation(
          { lat: result.lat, lng: result.lng },
          result.address || name,
          level === 'dong' ? 5 : 7,
        );
      }
    } finally {
      setIsMoving(false);
    }
  };

  const formatAmount = (amount: number) => {
    const revenueInOk = amount / 100000000;
    return `${revenueInOk.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}억`;
  };

  return {
    items,
    isLoading,
    error,
    isMoving,
    handleSelect,
    formatAmount,
  };
};