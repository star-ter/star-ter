import AreaContents from './AreaContents';
import PopulationContents from './PopulationContents';
import IndustryContents from './IndustryContents';
import CompareContents from './CompareContents';

type ActiveType = 'area' | 'population' | 'industry' | 'compare' | 'none';
type ModalCardProps = { active: ActiveType; onClose: () => void };

export default function ModalCard({ active, onClose }: ModalCardProps) {
  return (
    <section className="mb-[24px] flex flex-col justify-center gap-4 rounded-2xl bg-white/80 px-4 py-4 shadow-md ring-1 ring-black/5">
      {active === 'area' ? (
        <AreaContents onClose={onClose}></AreaContents>
      ) : active === 'population' ? (
        <PopulationContents onClose={onClose}></PopulationContents>
      ) : active === 'compare' ? (
        <CompareContents onClose={onClose}></CompareContents>
      ) : active === 'industry' ? (
        <IndustryContents onClose={onClose}></IndustryContents>
      ) : (
        <></>
      )}
    </section>
  );
}
