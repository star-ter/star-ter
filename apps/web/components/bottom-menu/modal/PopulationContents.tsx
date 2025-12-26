import PillButton from '../PillButton';
import { usePopulationVisual } from '../../../hooks/usePopulationVisual';
import { GenderFilter, AgeFilter } from '../../../types/population-types';

interface Props {
  onClose: () => void;
  onView: () => void;
  population: ReturnType<typeof usePopulationVisual>;
}

export default function PopulationContents({ onClose, onView, population }: Props) {
  const { 
    genderFilter, setGenderFilter, 
    ageFilter, setAgeFilter, loadData 
  } = population;

  const genders: GenderFilter[] = ['Total', 'Male', 'Female'];
  const ages: AgeFilter[] = ['Total', '0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60+'];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">유동인구 분석</h3>
        <PillButton label="닫기" onClick={onClose} />
      </div>
      
      {/* 성별 선택 */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase">성별</label>
        <div className="mt-2 flex gap-2">
          {genders.map(g => (
            <button key={g} onClick={() => setGenderFilter(g)}
              className={`px-3 py-1 rounded-lg text-xs ${genderFilter === g ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
              {g === 'Total' ? '전체' : g === 'Male' ? '남성' : '여성'}
            </button>
          ))}
        </div>
      </div>

      {/* 연령대 선택 */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase">연령대</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {ages.map(a => (
            <button key={a} onClick={() => setAgeFilter(a)}
              className={`px-3 py-1 rounded-lg text-xs ${ageFilter === a ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {a === 'Total' ? '전체' : a}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => { loadData(); onView(); }}
        className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white">
        유동인구보기
      </button>
    </section>
  );
}