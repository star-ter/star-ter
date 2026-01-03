import { IndustryCategory } from '../../types/bottom-menu-types';

type RankNavHeaderProps = {
  areaName?: string;
  categoryName?: string;
  level: 'gu' | 'dong';
  selectedCategory?: IndustryCategory;
  selectedSubCode: string | null;
  onSubCodeChange: (code: string | null) => void;
};

export default function RankNavHeader({
  areaName,
  categoryName,
  level,
  selectedCategory,
  selectedSubCode,
  onSubCodeChange,
}: RankNavHeaderProps) {
  return (
    <header className="flex flex-col gap-2 mb-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {categoryName ? `${categoryName} ` : ''}
            {level === 'dong' && areaName
              ? `${areaName} 매출 순위`
              : level === 'dong'
                ? '동 매출 순위'
                : '서울시 매출 순위'}
          </h2>
          <p className="text-xs text-gray-500">
            {level === 'dong' && areaName
              ? `${areaName} 기준`
              : level === 'dong'
                ? '현재 구 기준'
                : '서울시 기준'}{' '}
            분기 매출
          </p>
        </div>

        {/* Info Tooltip */}
        <div className="relative group p-1 z-50">
          <svg
            className="w-5 h-5 text-gray-400 cursor-help hover:text-gray-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900/90 backdrop-blur-sm text-white text-xs rounded-xl p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
            <h4 className="font-bold mb-2 text-gray-200 pb-1 border-b border-gray-700">
              상권 유형 안내
            </h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="text-blue-300 font-semibold min-w-16">
                  뜨는 상권
                </span>
                <span className="text-gray-300">
                  개업은 많고 폐업은 적어 성장하는 지역
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-amber-400 font-semibold min-w-16">
                  변동 상권
                </span>
                <span className="text-gray-300">
                  개업과 폐업이 모두 많아 변화가 심한 지역
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 font-semibold min-w-16">
                  정체 상권
                </span>
                <span className="text-gray-300">
                  개업과 폐업이 모두 적어 변화가 없는 지역
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-red-400 font-semibold min-w-16">
                  위험 상권
                </span>
                <span className="text-gray-300">
                  개업은 적고 폐업이 많아 쇠퇴하는 지역
                </span>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute top-0 right-2 -mt-1 w-2 h-2 bg-gray-900/90 rotate-45 transform"></div>
          </div>
        </div>
      </div>

      {/* Sub Category Selector */}
      {selectedCategory?.children && selectedCategory.children.length > 0 && (
        <div className="mb-2">
          <select
            value={selectedSubCode || ''}
            onChange={(e) => {
              const val = e.target.value;
              onSubCodeChange(val === '' ? null : val);
            }}
            className="w-full rounded-xl border-gray-200 bg-gray-50 py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-colors cursor-pointer hover:bg-white border outline-none"
          >
            <option value="">전체 ({selectedCategory.name})</option>
            {selectedCategory.children.map((child) => (
              <option key={child.code} value={child.code}>
                {child.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </header>
  );
}
