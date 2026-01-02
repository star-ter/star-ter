import { useState, useEffect } from 'react';
import { ReportData } from '@/types/report.types';

export const useReport = (regionCode: string, industryCode: string) => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(!!(regionCode && industryCode));
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (!regionCode || !industryCode) {
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      setLoading(true);
      setData(null); // 이전 데이터 초기화
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/report/summary?regionCode=${regionCode}&industryCode=${industryCode}`
        );
        if (!response.ok) {
          throw new Error(`리포트 데이터를 가져오는데 실패했습니다. (${response.status})`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [regionCode, industryCode, API_BASE_URL]);

  return { data, loading, error };
};
