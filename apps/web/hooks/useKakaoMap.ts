import { useEffect, useState } from 'react';
import { KakaoMap } from '../types/map-types';

export const useKakaoMap = (mapRef: React.RefObject<HTMLDivElement | null>) => {
  const [map, setMap] = useState<KakaoMap | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false&libraries=services`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        setLoaded(true);
      });
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (loaded && mapRef.current && !map) {
      const options = {
        center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // Seoul City Hall
        level: 8,
      };
      const mapInstance = new window.kakao.maps.Map(mapRef.current, options);
      setMap(mapInstance);
    }
  }, [loaded, mapRef, map]);

  return { map, loaded };
};
