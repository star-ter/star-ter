import { IndustryCategory } from '../../types/bottom-menu-types';

type IndustrySubSelectProps = {
  selectedCategory: IndustryCategory | null;
  selectedSubCode: string | null;
  onSubCodeChange: (code: string | null) => void;
};

export default function IndustrySubSelect({
  selectedCategory,
  selectedSubCode,
  onSubCodeChange,
}: IndustrySubSelectProps) {
  if (!selectedCategory?.children || selectedCategory.children.length === 0) {
    return null;
  }

  return (
    <div className="w-[330px] z-300 rounded-2xl bg-white/90 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur pointer-events-auto">
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
          상세 업종 필터
        </label>
        <div className="relative">
          <select
            value={selectedSubCode || ''}
            onChange={(e) => {
              const val = e.target.value;
              onSubCodeChange(val === '' ? null : val);
            }}
            className="w-full appearance-none rounded-xl border-gray-200 bg-gray-50/50 py-2.5 pl-3.5 pr-10 text-sm font-medium text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer hover:bg-white border outline-none"
          >
            <option value="">전체 ({selectedCategory.name})</option>
            {selectedCategory.children.map((child) => (
              <option key={child.code} value={child.code}>
                {child.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
