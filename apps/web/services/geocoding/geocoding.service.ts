import type {
  KakaoCoord2AddressResult,
  KakaoGeocoderResult,
  KakaoPlaceResult,
} from '../../types/kakao';
import type { GeocodeResult, ReverseGeocodeResult } from '../../types/map-types';

export async function geocodeAddress(
  query: string
): Promise<GeocodeResult | null> {
  if (typeof window === 'undefined' || !window.kakao?.maps) {
    return null;
  }

  return new Promise((resolve) => {
    window.kakao.maps.load(() => {
      try {
        const geocoder = new window.kakao.maps.services.Geocoder();

        geocoder.addressSearch(
          query,
          (result: KakaoGeocoderResult[], status: string) => {
            if (
              status === window.kakao.maps.services.Status.OK &&
              result.length > 0
            ) {
              const data = result[0];
              resolve({
                lat: parseFloat(data.y),
                lng: parseFloat(data.x),
                address: data.address_name,
                roadAddress: data.road_address?.address_name,
                buildingName: data.road_address?.building_name,
              });
            } else {
              geocodeByKeyword(query).then(resolve);
            }
          }
        );
      } catch (error) {
        console.error(error);
        resolve(null);
      }
    });
  });
}

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
        const seoulCenter = new window.kakao.maps.LatLng(37.5665, 126.978);

        places.keywordSearch(
          keyword,
          (result: KakaoPlaceResult[], status: string) => {
            if (
              status === window.kakao.maps.services.Status.OK &&
              result.length > 0
            ) {
              const seoulResults = result.filter(
                (item) =>
                  item.address_name?.includes('서울') ||
                  item.road_address_name?.includes('서울')
              );

              const data = seoulResults.length > 0 ? seoulResults[0] : null;

              if (data) {
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
            } else {
              resolve(null);
            }
          },
          {
            location: seoulCenter,
            radius: 20000,
          }
        );
      } catch (error) {
        console.error(error);
        resolve(null);
      }
    });
  });
}

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

  return results.filter(
    (r): r is GeocodeResult & { query: string } => r !== null
  );
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  if (typeof window === 'undefined' || !window.kakao?.maps) {
    return null;
  }

  return new Promise((resolve) => {
    window.kakao.maps.load(() => {
      try {
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.coord2Address(
          lng,
          lat,
          (result: KakaoCoord2AddressResult[], status: string) => {
            if (
              status === window.kakao.maps.services.Status.OK &&
              result.length > 0
            ) {
              const data = result[0];
              const address = data.address;

              resolve({
                address: address?.address_name || '',
                roadAddress: data.road_address?.address_name,
                guName: address?.region_1depth_name.includes('서울')
                  ? address?.region_2depth_name
                  : undefined,
                dongName: address?.region_3depth_name,
              });
            } else {
              resolve(null);
            }
          }
        );
      } catch (error) {
        console.error(error);
        resolve(null);
      }
    });
  });
}
