import proj4 from 'proj4';

/**
 * Proj4에 SGIS 좌표계(EPSG:5179, UTM-K) 정의 추가.
 * 최초 1회 실행.
 */
export const initProj4 = () => {
  if (typeof window !== 'undefined' && !proj4.defs('EPSG:5179')) {
    proj4.defs(
      'EPSG:5179',
      '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    );
  }
};

/**
 * 좌표를 카카오맵에서 사용할 수 있는 WGS84 좌표계(위경도)로 변환.
 * - 입력받은 좌표가 이미 위경도(WGS84) 범위라면 그대로 반환.
 * - 입력받은 좌표가 UTM-K(EPSG:5179) 범위라면 변환하여 반환.
 * @param x 경도 (Longitude) 또는 X 좌표
 * @param y 위도 (Latitude) 또는 Y 좌표
 * @returns window.kakao.maps.LatLng 객체
 */
export const convertCoord = (x: number, y: number) => {
  if (x > 180) {
    const [lng, lat] = proj4('EPSG:5179', 'EPSG:4326', [x, y]);
    return new window.kakao.maps.LatLng(lat, lng);
  }
  return new window.kakao.maps.LatLng(y, x);
};

/* GeoJSON -> WKT format(소상공인) */
export const convertToWKT = (
  data: number[][][][] | number[][][] | number[][],
): string => {
  if (!data || data.length === 0) return '';

  let ring: number[][] | undefined;

  // data[0]이 number[] (즉 [x, y]) 형태인지 확인하는 함수 (Ring 판별)
  const isRing = (val: unknown): val is number[][] => {
    return (
      Array.isArray(val) &&
      val.length > 0 &&
      Array.isArray(val[0]) &&
      typeof val[0][0] === 'number'
    );
  };

  // Case 1: number[][] (Ring)
  if (isRing(data)) {
    ring = data;
  }
  // Case 2: number[][][] (Polygon)
  else if (Array.isArray(data[0]) && isRing(data[0])) {
    ring = data[0] as number[][];
  }
  // Case 3: number[][][][] (MultiPolygon)
  else {
    const layer1 = data[0];
    if (Array.isArray(layer1)) {
      const layer2 = layer1[0];
      if (isRing(layer2)) {
        ring = layer2;
      }
    }
  }

  if (!ring) return '';

  const coordinates = ring.map((point) => `${point[0]} ${point[1]}`).join(', ');

  return `POLYGON((${coordinates}))`;
};
