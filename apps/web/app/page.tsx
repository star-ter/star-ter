import Kakaomap from '@/components/kakaomap';
import MapBox from '@/components/map/MapBox';
export default function Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Kakaomap />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <MapBox />
      </div>
    </div>
  );
}
