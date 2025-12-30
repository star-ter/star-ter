import PillButton from '../PillButton';
import { usePopulationVisual } from '../../../hooks/usePopulationVisual';
import { GenderFilter, AgeFilter, TimeFilter } from '../../../types/population-types';

interface Props {
  onClose: () => void;
  onView: () => void;
  population: ReturnType<typeof usePopulationVisual>;
}

export default function PopulationContents({ onClose, onView, population }: Props) {
  const { 
    genderFilter, setGenderFilter, 
    ageFilter, setAgeFilter,
    timeFilter, setTimeFilter,
    showLayer, setShowLayer
  } = population;

  const times: TimeFilter[] = ['All', '0-8', '8-16', '16-24'];
  const genders: GenderFilter[] = ['Total', 'Male', 'Female'];
  const ages: AgeFilter[] = ['Total', '10대', '20대', '30대', '40대', '50대', '60대+'];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">유동인구 분석</h3>
        <PillButton label="닫기" onClick={onClose} />
      </div>

      {/* 시간대 선택 */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase">시간대</label>
        <div className="mt-2 flex gap-2">
          {times.map(t => (
            <button 
              key={t} 
              onClick={() => setTimeFilter(t)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${timeFilter === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t === 'All' ? '전체' : t === '0-8' ? '새벽 (0-8시)' : t === '8-16' ? '낮 (8-16시)' : '밤 (16-24시)'}
            </button>
          ))}
        </div>
      </div>
      
      {/* 성별 선택 */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase">성별</label>
        <div className="mt-2 flex gap-2">
          {genders.map(g => (
            <button 
              key={g} 
              onClick={() => setGenderFilter(g)}
              className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${genderFilter === g ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
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
            <button 
              key={a} 
              onClick={() => setAgeFilter(a)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${ageFilter === a ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {a === 'Total' ? '전체' : a}
            </button>
          ))}
        </div>
      </div>

      {showLayer ? (
        <button 
          onClick={() => { setShowLayer(false); onClose(); }}
          className="w-full rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform"
        >
          유동인구 끄기
        </button>
      ) : (
        <button 
          onClick={() => { setShowLayer(true); onView(); }}
          className="w-full rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform"
        >
          유동인구 보기
        </button>
      )}
    </section>
  );
}