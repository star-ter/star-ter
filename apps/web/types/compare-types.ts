import { CompareRequest } from './bottom-menu-types';

export type LocationTarget = 'A' | 'B';

export interface RegionCandidate {
  type: string;
  code: string;
  name: string;
  fullName?: string;
}

export interface CompareContentsProps {
  onClose: () => void;
  targetA: string;
  targetB: string;
  propCodeA?: string;
  propCodeB?: string;
  changeTargetA: (value: string) => void;
  changeTargetB: (value: string) => void;
  onPickLocation: (target: LocationTarget) => void;
  onCompare: (data: CompareRequest) => void;
}

export interface LocationInputProps {
  value: string;
  placeholder: string;
  candidates: RegionCandidate[];
  onChange: (value: string) => void;
  onSearch: (keyword: string) => void;
  onSelect: (item: RegionCandidate) => void;
  onPickFromMap: () => void;
}

export interface RegionDropdownProps {
  candidates: RegionCandidate[];
  onSelect: (item: RegionCandidate) => void;
}
