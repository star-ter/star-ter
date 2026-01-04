import GlobalHeader from './GlobalHeader';
import SearchBox from '../search/SearchBox';
import LocationNav from '../left-top/LocationNav';
import { AreaItem } from '@/hooks/useLocationSync';

interface MapHeaderProps {
  guList: AreaItem[];
  dongList: AreaItem[];
  selectedGu: string;
  selectedDong: string;
  isLoadingGu: boolean;
  isLoadingDong: boolean;
  isSyncing: boolean;
  changeGu: (guCode: string) => void;
  changeDong: (dongCode: string) => void;
}

export default function MapHeader(props: MapHeaderProps) {
  const leftContent = (
    <div className="flex items-center gap-4">
      {/* SearchBox is now part of the left content */}
      <SearchBox />
      {/* LocationNav receives all props directly */}
      <LocationNav {...props} />
    </div>
  );

  return (
    <GlobalHeader
      leftContent={leftContent}
      // Right content defaults to LoginButton in GlobalHeader
      className="bg-transparent pointer-events-none"
    />
  );
}
