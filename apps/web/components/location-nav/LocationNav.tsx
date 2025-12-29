import { useEffect, useState } from 'react';
import { geocodeAddress } from '@/services/geocoding/geocoding.service';
import { useMapStore } from '@/stores/useMapStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type AreaItem = {
  code: string;
  name: string;
};

type AreaListResponse = {
  items: AreaItem[];
};

export default function LocationNav() {
  const [guList, setGuList] = useState<AreaItem[]>([]);
  const [dongList, setDongList] = useState<AreaItem[]>([]);
  const [selectedGu, setSelectedGu] = useState('');
  const [selectedDong, setSelectedDong] = useState('');
  const [isLoadingGu, setIsLoadingGu] = useState(!!API_BASE_URL);
  const [isLoadingDong, setIsLoadingDong] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const { moveToLocation } = useMapStore();
  const selectBaseClass =
    'w-full min-w-[140px] appearance-none rounded-xl border border-black/10 bg-white/90 px-3 py-2 pr-8 text-sm font-semibold text-gray-900 shadow-sm transition focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60';

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
        if (err.name === 'AbortError') return;
        setGuList([]);
      })
      .finally(() => {
        setIsLoadingGu(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!API_BASE_URL) return;
    if (!selectedGu) {
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
        if (err.name === 'AbortError') return;
        setDongList([]);
      })
      .finally(() => {
        setIsLoadingDong(false);
      });

    return () => controller.abort();
  }, [selectedGu]);

  const handleMoveToGu = async (guName: string) => {
    if (!guName || isMoving) return;
    setIsMoving(true);
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
      setIsMoving(false);
    }
  };

  const handleMoveToDong = async (guName: string, dongName: string) => {
    if (!guName || !dongName || isMoving) return;
    setIsMoving(true);
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
      setIsMoving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-linear-to-br from-amber-50/90 via-white/90 to-rose-50/90 p-2 shadow-lg ring-1 ring-black/5 backdrop-blur">
      <div className="relative">
        <select name="city" id="" defaultValue="11" className={selectBaseClass}>
          <option value="11">서울특별시</option>
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
          ▾
        </span>
      </div>
      <div className="relative">
        <select
          name="gu"
          id=""
          value={selectedGu}
          onChange={async (event) => {
            const nextGuCode = event.target.value;
            const guName =
              guList.find((gu) => gu.code === nextGuCode)?.name || '';
            setSelectedGu(nextGuCode);
            setSelectedDong('');
            if (!nextGuCode) {
              setDongList([]);
              return;
            }
            await handleMoveToGu(guName);
          }}
          disabled={!guList.length || isLoadingGu || isMoving}
          className={selectBaseClass}
        >
          <option value="">
            {isLoadingGu ? '구 불러오는 중...' : '구 선택'}
          </option>
          {guList.map((gu) => (
            <option key={gu.code} value={gu.code}>
              {gu.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
          ▾
        </span>
      </div>
      <div className="relative">
        <select
          name="dong"
          id=""
          value={selectedDong}
          onChange={async (event) => {
            const nextDongCode = event.target.value;
            const dongName =
              dongList.find((dong) => dong.code === nextDongCode)?.name || '';
            const guName =
              guList.find((gu) => gu.code === selectedGu)?.name || '';
            setSelectedDong(nextDongCode);
            if (!nextDongCode) return;
            await handleMoveToDong(guName, dongName);
          }}
          disabled={
            !selectedGu || !dongList.length || isLoadingDong || isMoving
          }
          className={selectBaseClass}
        >
          <option value="">
            {isLoadingDong ? '동 불러오는 중...' : '동 선택'}
          </option>
          {dongList.map((dong) => (
            <option key={dong.code} value={dong.code}>
              {dong.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
          ▾
        </span>
      </div>
    </div>
  );
}
