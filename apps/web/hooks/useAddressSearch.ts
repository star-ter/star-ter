import { useState } from 'react';
import toast from 'react-hot-toast';
import { geocodeAddress } from '@/services/geocoding/geocoding.service';
import { useMapStore } from '@/stores/useMapStore';

interface UseAddressSearchReturn {
  searchValue: string;
  isSearching: boolean;
  setSearchValue: (value: string) => void;
  onSearch: (onSuccess?: () => void) => Promise<void>;
}

export const useAddressSearch = (): UseAddressSearchReturn => {
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { moveToLocation } = useMapStore();

  const onSearch = async (onSuccess?: () => void) => {
    if (!searchValue.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const result = await geocodeAddress(searchValue);
      if (result) {
        moveToLocation(
          { lat: result.lat, lng: result.lng },
          result.buildingName || result.address || searchValue,
          3,
          true,
        );
        setSearchValue('');
        onSuccess?.();
      } else {
        toast.error(`"${searchValue}"의 위치를 찾을 수 없습니다.`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchValue,
    isSearching,
    setSearchValue,
    onSearch,
  };
};
