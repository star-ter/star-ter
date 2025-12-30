import { useState, useEffect, useCallback } from 'react';
import { useMapStore } from '@/stores/useMapStore';
import { geocodeAddress, reverseGeocode } from '@/services/geocoding/geocoding.service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type AreaItem = {
  code: string;
  name: string;
};

type AreaListResponse = {
  items: AreaItem[];
};

export const useLocationSync = () => {
  const [guList, setGuList] = useState<AreaItem[]>([]);
  const [dongList, setDongList] = useState<AreaItem[]>([]);
  const [selectedGu, setSelectedGu] = useState('');
  const [selectedDong, setSelectedDong] = useState('');
  
  const [isLoadingGu, setIsLoadingGu] = useState(!!API_BASE_URL);
  const [isLoadingDong, setIsLoadingDong] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // 내부 동기화 중(지도 이동 등) 여부
  
  // Pending states for sync
  const [pendingDong, setPendingDong] = useState('');
  const [pendingDongName, setPendingDongName] = useState('');

  const { moveToLocation, center, isMoving: isMapMoving } = useMapStore();

  // 1. 구 목록 로드
  useEffect(() => {
    if (!API_BASE_URL) return;
    const controller = new AbortController();
    const url = new URL(`${API_BASE_URL}/geo/gus`);
    url.searchParams.set('cityCode', '11');

    fetch(url.toString(), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load gus');
        return res.json();
      })
      .then((data: AreaListResponse) => {
        setGuList(data.items || []);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setGuList([]);
      })
      .finally(() => {
        setIsLoadingGu(false);
      });

    return () => controller.abort();
  }, []);

  // 2. 구 선택 변경 시 동 목록 로드
  useEffect(() => {
    if (!API_BASE_URL) return;
    if (!selectedGu) {
      setDongList([]);
      setIsLoadingDong(false);
      return;
    }

    const controller = new AbortController();
    const url = new URL(`${API_BASE_URL}/geo/dongs`);
    url.searchParams.set('guCode', selectedGu);

    setIsLoadingDong(true);
    fetch(url.toString(), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dongs');
        return res.json();
      })
      .then((data: AreaListResponse) => {
        setDongList(data.items || []);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setDongList([]);
      })
      .finally(() => {
        setIsLoadingDong(false);
      });

    return () => controller.abort();
  }, [selectedGu]);

  // 3. 지도 이동 감지하여 위치 동기화 (with Fallback)
  useEffect(() => {
    if (!center || isMapMoving || isSyncing) return;

    // 딜레이 최소화 (30ms)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/geo/gu?lat=${center.lat}&lng=${center.lng}`,
        );

        if (res.ok) {
          const data = await res.json();
          // data: { signguCode, signguName, adstrdCode, adstrdName }
          
          if (data.signguCode && data.signguCode !== selectedGu) {
            setSelectedGu(data.signguCode);
            if (data.adstrdCode) {
              setPendingDong(data.adstrdCode);
            }
          } else if (
            data.signguCode === selectedGu &&
            data.adstrdCode &&
            data.adstrdCode !== selectedDong
          ) {
            const exists = dongList.find((d) => d.code === data.adstrdCode);
            if (exists) {
              setSelectedDong(data.adstrdCode);
            } else {
              setPendingDong(data.adstrdCode);
            }
          }
        } else {
          throw new Error('Backend API Error');
        }
      } catch {
        // Fallback: Reverse Geocoding
        const geoResult = await reverseGeocode(center.lat, center.lng);
        if (geoResult && geoResult.guName) {
          const foundGu = guList.find((g) => g.name === geoResult.guName);
          if (foundGu) {
            if (foundGu.code !== selectedGu) {
              setSelectedGu(foundGu.code);
              if (geoResult.dongName) {
                setPendingDongName(geoResult.dongName);
              }
            } else if (geoResult.dongName) {
              const exists = dongList.find((d) => d.name === geoResult.dongName);
              if (exists) {
                setSelectedDong(exists.code);
              } else {
                setPendingDongName(geoResult.dongName);
              }
            }
          }
        }
      }
    }, 30);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, isMapMoving, isSyncing]);

  // 4. Pending Dong 처리
  useEffect(() => {
    if (dongList.length === 0) return;

    if (pendingDong) {
      const exists = dongList.find((d) => d.code === pendingDong);
      if (exists) {
        setSelectedDong(pendingDong);
        setPendingDong('');
      }
    }

    if (pendingDongName) {
      const exists = dongList.find((d) => d.name === pendingDongName);
      if (exists) {
        setSelectedDong(exists.code);
        setPendingDongName('');
      }
    }
  }, [dongList, pendingDong, pendingDongName]);

  // UI 핸들러
  const handleMoveToGu = useCallback(async (guName: string) => {
    if (!guName || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await geocodeAddress(`서울특별시 ${guName}`);
      if (result) {
        moveToLocation(
          { lat: result.lat, lng: result.lng },
          result.address || guName,
          7,
        );
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, moveToLocation]);

  const handleMoveToDong = useCallback(async (guName: string, dongName: string) => {
    if (!guName || !dongName || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await geocodeAddress(`서울특별시 ${guName} ${dongName}`);
      if (result) {
        moveToLocation(
          { lat: result.lat, lng: result.lng },
          result.address || `${guName} ${dongName}`,
          5,
        );
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, moveToLocation]);

  const changeGu = useCallback(async (guCode: string) => {
    setSelectedGu(guCode);
    setSelectedDong('');
    const guName = guList.find(g => g.code === guCode)?.name;
    if (guName) {
      await handleMoveToGu(guName);
    } else if (!guCode) {
      setDongList([]);
    }
  }, [guList, handleMoveToGu]);

  const changeDong = useCallback(async (dongCode: string) => {
    setSelectedDong(dongCode);
    const dongName = dongList.find(d => d.code === dongCode)?.name;
    const guName = guList.find(g => g.code === selectedGu)?.name;
    if (dongName && guName) {
      await handleMoveToDong(guName, dongName);
    }
  }, [dongList, guList, selectedGu, handleMoveToDong]);

  return {
    guList,
    dongList,
    selectedGu,
    selectedDong,
    isLoadingGu,
    isLoadingDong,
    isSyncing,
    changeGu,
    changeDong,
  };
};
