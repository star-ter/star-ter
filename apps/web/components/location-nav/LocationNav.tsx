import { useEffect, useState } from 'react';
import { geocodeAddress, reverseGeocode } from '@/services/geocoding/geocoding.service';
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
  const { moveToLocation, center, isMoving: isMapMoving } = useMapStore();
  const [pendingDong, setPendingDong] = useState('');
  const [pendingDongName, setPendingDongName] = useState('');


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

  // 3. 지도 이동(드래그) 감지하여 현재 위치 주소 동기화
  useEffect(() => {
    if (!center || isMapMoving || isMoving) return; // 지도 이동 중에는 업데이트 안 함 (멈추면 함)
    // 딜레이를 최소화하여 빠르게 반응 (30ms)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/geo/gu?lat=${center.lat}&lng=${center.lng}`,
        );
        if (res.ok) {
          const data = await res.json();
          // data: { signguCode, signguName, adstrdCode, adstrdName }
          if (data.signguCode && data.signguCode !== selectedGu) {
            setSelectedGu(data.signguCode); // 구 변경 -> useEffect 2번 트리거 -> 동 목록 로드
            if (data.adstrdCode) {
              setPendingDong(data.adstrdCode); // 동 코드는 대기열에 저장
            }
          } else if (
            data.signguCode === selectedGu &&
            data.adstrdCode &&
            data.adstrdCode !== selectedDong
          ) {
            // 구는 같은데 동만 다른 경우 (= 같은 구 내에서 이동)
            // 동 목록은 이미 로드되어 있으므로 바로 변경 가능 (단, 리스트에 있는지 확인)
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
      } catch (error) {
        // Fallback: 카카오맵 역지오코딩 사용
        const geoResult = await reverseGeocode(center.lat, center.lng);
        if (geoResult && geoResult.guName) {
          // 구 이름으로 매칭
          const foundGu = guList.find((g) => g.name === geoResult.guName);
          if (foundGu) {
            if (foundGu.code !== selectedGu) {
              setSelectedGu(foundGu.code);
              // 동 이름 저장해두었다가 목록 로드 후 매칭
              if (geoResult.dongName) {
                setPendingDongName(geoResult.dongName);
              }
            } else if (geoResult.dongName) {
              // 구는 같은데 동이 다른 경우 (동 이름으로 찾아서 변경해야 함)
              // 동 목록이 로드되어 있다고 가정하고 매칭 시도, 없으면 pending으로
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
  }, [center, isMapMoving, isMoving]);

  // 4. 동 목록 로드 완료 후 Pending된 동 적용 (코드 or 이름)
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

  const labelClass =
    'block px-1 text-[13px] font-medium text-gray-700 transition-all group-hover:text-gray-900 group-hover:font-bold cursor-pointer whitespace-nowrap';

  const selectOverlayClass =
    'absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed';

  const currentGuName =
    guList.find((g) => g.code === selectedGu)?.name ||
    (isLoadingGu ? '로딩 중...' : '구 선택');
  const currentDongName =
    dongList.find((d) => d.code === selectedDong)?.name ||
    (isLoadingDong ? '로딩 중...' : '동 선택');

  const Separator = () => (
    <svg
      className="mx-1 h-4 w-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 5l7 7-7 7"
      />
    </svg>
  );

  return (
    <div className="flex items-center rounded-full bg-white/90 px-5 py-1.5">
      <div className="relative flex min-w-fit items-center group">
        <span className={labelClass}>서울특별시</span>
        <select
          name="city"
          defaultValue="11"
          className={selectOverlayClass}
        >
          <option value="11">서울특별시</option>
        </select>
      </div>

      <Separator />

      <div className="relative flex min-w-fit items-center group">
        <span
          className={`${labelClass} ${!selectedGu ? 'text-gray-400' : ''}`}
        >
          {currentGuName}
        </span>
        <select
          name="gu"
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
          className={selectOverlayClass}
        >
          <option value="">
            {isLoadingGu ? '로딩 중...' : '구 선택'}
          </option>
          {guList.map((gu) => (
            <option key={gu.code} value={gu.code}>
              {gu.name}
            </option>
          ))}
        </select>
      </div>

      <Separator />

      <div className="relative flex min-w-fit items-center group">
        <span
          className={`${labelClass} ${!selectedDong ? 'text-gray-400' : ''}`}
        >
          {currentDongName}
        </span>
        <select
          name="dong"
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
          className={selectOverlayClass}
        >
          <option value="">
            {isLoadingDong ? '로딩 중...' : '동 선택'}
          </option>
          {dongList.map((dong) => (
            <option key={dong.code} value={dong.code}>
              {dong.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
