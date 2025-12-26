import SearchBox from '../search/SearchBox';
import BottomMenuBox from '../bottom-menu/BottomMenuBox';
import { usePopulationVisual } from '../../hooks/usePopulationVisual';

interface MapBoxProps {
  locationA: string;
  locationB: string;
  setLocationA: (area: string) => void;
  setLocationB: (area: string) => void;
  handlePickMode: (target: 'A' | 'B') => void;
  population: ReturnType<typeof usePopulationVisual>;
}

export default function MapBox({
  locationA,
  locationB,
  setLocationA,
  setLocationB,
  handlePickMode,
  population,
}: MapBoxProps) {
  return (
    <section className="w-full h-full flex flex-col justify-between items-center pointer-events-none">
      <div className="pointer-events-auto">
        <SearchBox />
      </div>
      <div className="pointer-events-auto">
        <BottomMenuBox
          locationA={locationA}
          locationB={locationB}
          setLocationA={setLocationA}
          setLocationB={setLocationB}
          handlePickMode={handlePickMode}
          population={population}
        />
      </div>
    </section>
  );
}
