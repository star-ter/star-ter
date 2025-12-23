import SearchBox from '../search/SearchBox';
import BottomMenuBox from '../bottom-menu/BottomMenuBox';

export default function MapBox() {
  return (
    <section className="w-[100vw] h-[100vh] flex flex-col justify-between items-center">
      <SearchBox></SearchBox>
    </section>
  );
}
