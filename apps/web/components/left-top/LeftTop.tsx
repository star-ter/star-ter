import SearchBox from '../search/SearchBox';
import RankNav from '../rank-nav/RankNav';

export default function LeftTop() {
  return (
    <section className="relative">
      <div className="pointer-events-auto">
        <SearchBox />
      </div>
      <div className="absolute">
        <RankNav />
      </div>
    </section>
  );
}
