import SearchBox from '../search/SearchBox';
import BottomMenuBox from '../bottom-menu/BottomMenuBox';

export default function MapBox() {
  return (
    <section className="w-screen h-screen flex flex-col justify-between items-center">
      <SearchBox></SearchBox>
      <BottomMenuBox></BottomMenuBox>
    </section>
  );
}
