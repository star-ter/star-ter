import { BiTargetLock } from 'react-icons/bi';
import { LocationInputProps, RegionCandidate } from '../../../types/compare-types';
import RegionDropdown from './RegionDropdown';

export default function LocationInput({
  value,
  placeholder,
  candidates,
  onChange,
  onSearch,
  onSelect,
  onPickFromMap,
}: LocationInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(e.currentTarget.value);
    }
  };

  const handleSelect = (item: RegionCandidate) => {
    onSelect(item);
  };

  return (
    <div className="relative flex gap-2 w-full">
      <div className="relative flex-1">
        <input
          className="w-full rounded-xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <RegionDropdown candidates={candidates} onSelect={handleSelect} />
      </div>
      <button
        onClick={onPickFromMap}
        className="flex items-center justify-center w-[120px] shrink-0 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
        title="지도에서 선택"
      >
        <BiTargetLock size={18} />
        <p className="ml-1 text-sm">지도선택</p>
      </button>
    </div>
  );
}
