interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  roadAddress?: string;
  buildingName?: string;
}

/**
 * 카카오맵 SDK Geocoder를 사용하여 주소를 좌표로 변환
 * JavaScript 키만으로 동작하며 IP/도메인 제한 없음
 * @param query - 검색할 주소 또는 장소명
 * @returns 좌표 정보 또는 null
 */
export async function geocodeAddress(
  query: string
): Promise<GeocodeResult | null> {
  // 브라우저 환경 체크
  if (typeof window === 'undefined' || !window.kakao?.maps) {
    console.error('Kakao Maps is not loaded');
    return null;
  }

  return new Promise((resolve) => {
    // kakao.maps.load() 콜백 안에서만 services 사용 가능
    window.kakao.maps.load(() => {
      try {
        const geocoder = new window.kakao.maps.services.Geocoder();

        // 주소 검색
        geocoder.addressSearch(query, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            const data = result[0];
            resolve({
              lat: parseFloat(data.y),
              lng: parseFloat(data.x),
              address: data.address_name,
              roadAddress: data.road_address?.address_name,
              buildingName: data.road_address?.building_name,
            });
          } else {
            // 주소 검색 실패 시 키워드 검색
            geocodeByKeyword(query).then(resolve);
          }
        });
      } catch (error) {
        console.error('Geocoder error:', error);
        resolve(null);
      }
    });
  });
}

/**
 * 키워드로 장소 검색 (주소 검색 실패 시 대안)
 */
async function geocodeByKeyword(
  keyword: string
): Promise<GeocodeResult | null> {
  if (typeof window === 'undefined' || !window.kakao?.maps) {
    return null;
  }

  return new Promise((resolve) => {
    window.kakao.maps.load(() => {
      try {
        const places = new window.kakao.maps.services.Places();

        places.keywordSearch(keyword, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            const data = result[0];
            resolve({
              lat: parseFloat(data.y),
              lng: parseFloat(data.x),
              address: data.address_name || data.place_name,
              roadAddress: data.road_address_name,
              buildingName: data.place_name,
            });
          } else {
            resolve(null);
          }
        });
      } catch (error) {
        console.error('Keyword search error:', error);
        resolve(null);
      }
    });
  });
}

/**
 * 여러 주소를 일괄 지오코딩
 * @param queries - 검색할 주소/장소 배열
 * @returns 좌표 정보 배열 (실패한 것은 제외)
 */
export async function geocodeAddresses(
  queries: string[]
): Promise<Array<GeocodeResult & { query: string }>> {
  const results = await Promise.all(
    queries.map(async (query) => {
      const result = await geocodeAddress(query);
      if (result) {
        return { ...result, query };
      }
      return null;
    })
  );

  return results.filter((r): r is GeocodeResult & { query: string } => r !== null);
}
