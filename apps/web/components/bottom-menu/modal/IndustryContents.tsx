import { GiForkKnifeSpoon } from 'react-icons/gi';
import { IoBag } from 'react-icons/io5';
import { RiCustomerServiceFill } from 'react-icons/ri';
import { IoLogoGameControllerB } from 'react-icons/io';
import { MdMenuBook } from 'react-icons/md';
import { IoIosBed } from 'react-icons/io';

import PillButton from '../PillButton';
import IndustryItem from './IndustryItem';

const items = [
  { label: '음식', iconLabel: GiForkKnifeSpoon },
  { label: '소매', iconLabel: IoBag },
  { label: '서비스', iconLabel: RiCustomerServiceFill },
  { label: '오락', iconLabel: IoLogoGameControllerB },
  { label: '교육', iconLabel: MdMenuBook },
  { label: '숙박', iconLabel: IoIosBed },
];

export default function IndustryContents({ onClose }: { onClose: () => void }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">업종</h3>
        <PillButton label="닫기" onClick={onClose}></PillButton>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        지도에 표시할 업종을 선택하세요
      </p>
      <div className="flex gap-[16px] mt-3">
        {items.map(({ label, iconLabel }) => (
          <IndustryItem key={label} label={label} iconLabel={iconLabel} />
        ))}
      </div>
    </section>
  );
}
