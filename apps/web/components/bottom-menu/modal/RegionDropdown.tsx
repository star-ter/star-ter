import { RegionDropdownProps, RegionCandidate } from '../../../types/compare-types';

export default function RegionDropdown({
  candidates,
  onSelect,
}: RegionDropdownProps) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <ul className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-50">
      {candidates.map((item: RegionCandidate) => (
        <li
          key={`${item.type}-${item.code}`}
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
          onClick={() => onSelect(item)}
        >
          <span className="text-gray-900 font-medium">
            {item.fullName || item.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
