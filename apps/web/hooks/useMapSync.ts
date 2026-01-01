import { useState, useEffect } from 'react';
import { useMapStore } from '@/stores/useMapStore';

interface UseMapSyncReturn {
  currentGuCode: string | null;
  currentGuName: string | null;
}

export const useMapSync = (): UseMapSyncReturn => {
  const { center, zoom } = useMapStore();
  const [currentGuCode, setCurrentGuCode] = useState<string | null>(null);
  const [currentGuName, setCurrentGuName] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (zoom <= 7 && zoom >= 5 && center) {
      timeoutId = setTimeout(() => {
        const fetchGuCode = async () => {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/geo/gu?lat=${center.lat}&lng=${center.lng}`,
            );
            if (res.ok) {
              const text = await res.text();
              if (!text) return;
              const data = JSON.parse(text);
              if (data?.signguCode) {
                setCurrentGuCode(data.signguCode);
                setCurrentGuName(data.signguName);
              }
            }
          } catch (error) {
            console.error('Failed to fetch Gu code:', error);
          }
        };
        fetchGuCode();
      }, 500);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [center, zoom]);

  return { currentGuCode, currentGuName };
};
