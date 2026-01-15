import { useEffect, useState } from 'react';

// ============================================================
// 전역 Window 타입 확장 (Global Type Augmentation)
// ============================================================
// TypeScript는 window 객체에 어떤 속성이 있는지 미리 알고 있습니다.
// 하지만 카카오맵 SDK는 런타임에 동적으로 window.kakao를 추가하기 때문에
// TypeScript에게 "window에 kakao라는 속성이 있을 수 있어"라고 알려줘야 합니다.
//
// declare global: 전역 타입을 확장하겠다는 선언
// interface Window: 기존 Window 인터페이스에 속성을 추가
// ============================================================
declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (
          container: HTMLElement,
          options: { center: unknown; level: number },
        ) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        LatLngBounds: new () => KakaoBounds;
        event: {
          addListener: (
            target: unknown,
            type: string,
            handler: () => void,
          ) => void;
          removeListener: (
            target: unknown,
            type: string,
            handler: () => void,
          ) => void;
        };
        Polygon: new (options: {
          path: KakaoLatLng[] | KakaoLatLng[][];
          strokeWeight?: number;
          strokeColor?: string;
          strokeOpacity?: number;
          strokeStyle?: string;
          fillColor?: string;
          fillOpacity?: number;
          zIndex?: number;
        }) => KakaoPolygon;
        CustomOverlay: new (options: {
          position: KakaoLatLng;
          content: string | HTMLElement;
          map?: KakaoMap | null;
          zIndex?: number;
          xAnchor?: number;
          yAnchor?: number;
        }) => KakaoCustomOverlay;
        Circle: new (options: {
          center: KakaoLatLng;
          radius: number;
          strokeWeight?: number;
          strokeColor?: string;
          strokeOpacity?: number;
          fillColor?: string;
          fillOpacity?: number;
        }) => KakaoCircle;
      };
    };
  }
}

export interface KakaoPolygon {
  setMap: (map: KakaoMap | null) => void;
  setPath: (path: KakaoLatLng[] | KakaoLatLng[][]) => void;
  getBounds: () => KakaoBounds;
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
  getMap: () => KakaoMap | null;
  setPosition: (position: KakaoLatLng) => void;
  getPosition: () => KakaoLatLng;
  setContent: (content: string | HTMLElement) => void;
}

export interface KakaoCircle {
  setMap: (map: KakaoMap | null) => void;
  getPosition: () => KakaoLatLng;
  getRadius: () => number;
}

// ============================================================
// 카카오맵 관련 타입 정의
// ============================================================
export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoBounds {
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
  contain: (latlng: KakaoLatLng) => boolean;
  extend: (latlng: KakaoLatLng) => void;
}

export interface KakaoMapProjection {
  containerPointFromCoords: (latlng: KakaoLatLng) => { x: number; y: number };
  coordsFromContainerPoint: (point: { x: number; y: number }) => KakaoLatLng;
}

export interface KakaoMap {
  getLevel: () => number;
  setLevel: (
    level: number,
    options?: { animate?: boolean | { duration: number } },
  ) => void;
  setCenter: (latlng: KakaoLatLng) => void;
  panTo: (
    latlng: KakaoLatLng,
    options?: { animate?: boolean | { duration: number } },
  ) => void;
  getCenter: () => KakaoLatLng;
  getBounds: () => KakaoBounds;
  setBounds: (bounds: KakaoBounds) => void;
  getProjection: () => KakaoMapProjection;
  relayout: () => void;
}

// ============================================================
// 스크립트 로딩 상태 관리 (모듈 레벨 변수)
// ============================================================
// 왜 모듈 레벨 변수인가?
// - 여러 컴포넌트에서 useKakaoMap을 동시에 사용해도 스크립트는 한 번만 로드
// - React 상태(useState)는 컴포넌트마다 독립적이지만, 모듈 레벨 변수는 공유됨
// ============================================================
let isScriptLoading = false; // 스크립트 로딩 중인지
let isScriptLoaded = false; // 스크립트 로딩 완료되었는지
const loadCallbacks: (() => void)[] = []; // 로딩 완료 시 호출할 콜백들

// ============================================================
// useKakaoMap 훅 옵션 타입
// ============================================================
interface UseKakaoMapOptions {
  // 초기 중심 좌표 (기본값: 서울시청)
  center?: { lat: number; lng: number };
  // 초기 줌 레벨 (기본값: 8, 숫자가 낮을수록 확대)
  level?: number;
}

// 기본값 상수
const DEFAULT_CENTER = { lat: 37.566826, lng: 126.9786567 }; // 서울시청
const DEFAULT_LEVEL = 8;

// ============================================================
// useKakaoMap 훅
// ============================================================
// 카카오맵 SDK를 로드하고 지도 인스턴스를 생성하는 커스텀 훅
//
// @param mapRef - 지도를 렌더링할 DOM 요소의 ref
// @param options - 초기 중심 좌표와 줌 레벨 설정
// @returns { map, loaded, error } - 지도 인스턴스, 로딩 완료 여부, 에러 상태
// ============================================================
export const useKakaoMap = (
  mapRef: React.RefObject<HTMLDivElement | null>,
  options: UseKakaoMapOptions = {},
) => {
  const { center = DEFAULT_CENTER, level = DEFAULT_LEVEL } = options;

  const [map, setMap] = useState<KakaoMap | null>(null);
  const [loaded, setLoaded] = useState(isScriptLoaded); // 이미 로드되었으면 true로 시작
  const [error, setError] = useState<string | null>(null);

  // 스크립트 로드 Effect
  // ============================================================
  // 왜 useCallback을 제거했나?
  // - React Compiler 린트 규칙: useEffect 내에서 동기적 setState 호출 금지
  // - 이미 로드된 경우 초기 상태(`useState(isScriptLoaded)`)에서 처리
  // - 비동기 콜백(onload)에서만 setState를 호출하여 규칙 준수
  // ============================================================
  useEffect(() => {
    // 이미 로드 완료된 경우: 초기 상태에서 이미 처리됨
    if (isScriptLoaded) {
      return;
    }

    // 로딩 중인 경우: 콜백만 등록하고 리턴
    if (isScriptLoading) {
      loadCallbacks.push(() => setLoaded(true));
      return;
    }

    // 최초 로딩 시작
    isScriptLoading = true;

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false&libraries=services`;
    script.async = true;

    // 로드 성공 시 (비동기 콜백 - setState 호출 OK)
    script.onload = () => {
      window.kakao.maps.load(() => {
        isScriptLoaded = true;
        isScriptLoading = false;
        setLoaded(true);

        // 대기 중이던 다른 컴포넌트들의 콜백 실행
        loadCallbacks.forEach((callback) => callback());
        loadCallbacks.length = 0; // 배열 비우기
      });
    };

    // 로드 실패 시 (비동기 콜백 - setState 호출 OK)
    script.onerror = () => {
      isScriptLoading = false;
      setError('카카오맵 SDK 로드에 실패했습니다.');
    };

    document.head.appendChild(script);
  }, []);

  // 지도 인스턴스 생성 Effect
  useEffect(() => {
    // 조건 체크: 로드 완료 + DOM 준비 + 아직 지도 없음
    if (loaded && mapRef.current && !map) {
      try {
        const mapOptions = {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: level,
        };
        const mapInstance = new window.kakao.maps.Map(
          mapRef.current,
          mapOptions,
        );
        setMap(mapInstance);
      } catch (e) {
        setError('지도 초기화에 실패했습니다.');
        console.error('Map initialization error:', e);
      }
    }
  }, [loaded, mapRef, map, center.lat, center.lng, level]);

  return { map, loaded, error };
};
