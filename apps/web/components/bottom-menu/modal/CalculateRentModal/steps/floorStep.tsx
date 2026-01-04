import {
  Warehouse,
  Home,
  Layers2,
  Layers3,
  Building,
  Building2,
} from 'lucide-react';

interface FloorStepProps {
  value: number;
  onChange: (floor: number) => void;
}

export const FLOORS = [
  { label: '지하 1층', value: -1, Icon: Warehouse },
  { label: '1층', value: 1, Icon: Home },
  { label: '2층', value: 2, Icon: Layers2 },
  { label: '3층', value: 3, Icon: Layers3 },
  { label: '4층', value: 4, Icon: Building },
  { label: '5층 이상', value: 5, Icon: Building2 },
];

export default function FloorStep({ value, onChange }: FloorStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-xl font-bold">
        <span className="text-blue-600">매장이 어떤 층</span>에 있는 걸
        생각하시는지 알려주세요.
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {FLOORS.map((item) => (
          <button
            key={item.value}
            className={`flex flex-col items-center justify-center p-4 py-8 rounded-xl border transition-all
              ${
                value === item.value
                  ? 'border-blue-500 bg-blue-50 text-blue-600 ring-1 ring-blue-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            onClick={() => onChange(item.value)}
          >
            <div
              className={`mb-3 p-3 rounded-full ${value === item.value ? 'bg-blue-100' : 'bg-gray-100'}`}
            >
              <item.Icon
                size={28}
                strokeWidth={1.5}
                className={
                  value === item.value ? 'text-blue-600' : 'text-gray-500'
                }
              />
            </div>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
