import SearchBox from '../search/SearchBox';
import BottomMenuBox from '../bottom-menu/BottomMenuBox';

export default function MapBox() {
  return (
    <section className="w-full h-full flex flex-col justify-between items-center pointer-events-none">
      <div className="pointer-events-auto">
        <SearchBox />
      </div>
      <div className="pointer-events-auto">
        <BottomMenuBox />
      </div>
    </section>
  );
}
