import { GiForkKnifeSpoon } from 'react-icons/gi';
import { IoBag } from 'react-icons/io5';
import { RiCustomerServiceFill } from 'react-icons/ri';
import { IoLogoGameControllerB } from 'react-icons/io';
import { MdMenuBook } from 'react-icons/md';
import { IoIosBed } from 'react-icons/io';
import { IconType } from 'react-icons';

import PillButton from '../PillButton';
import IndustryItem from './IndustryItem';
import { IndustryCategory } from '../../../types/bottom-menu-types';

interface Props {
  onClose: () => void;
  categories: IndustryCategory[];
  onSelect: (id: string) => void;
  isLoading: boolean;
}

const IconMap: Record<string, IconType> = {
  food: GiForkKnifeSpoon,
  retail: IoBag,
  service: RiCustomerServiceFill,
  game: IoLogoGameControllerB,
  education: MdMenuBook,
  hotel: IoIosBed,
};

export default function IndustryContents({
  onClose,
  categories,
  onSelect,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <section className="min-h-[150px] flex items-center justify-center">
        <span className="text-gray-400 text-sm">로딩중...</span>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">업종</h3>
        <PillButton label="닫기" onClick={onClose}></PillButton>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        지도에 표시할 업종을 선택하세요
      </p>
      <div className="flex gap-[16px] mt-3 overflow-x-auto pb-2">
        {categories.map(({ id, label, iconCode }) => {
          const Icon = IconMap[iconCode] ?? IoBag;
          return (
            <div
              key={id}
              onClick={() => onSelect(id)}
              className="cursor-pointer"
            >
              <IndustryItem label={label} iconLabel={Icon} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
