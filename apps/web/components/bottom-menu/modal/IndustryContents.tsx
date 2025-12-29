import { MdMenuBook } from 'react-icons/md'; // 교육
// import { MdSupportAgent } from 'react-icons/md'; // 시설관리 (Unused)
import { FaHospital } from 'react-icons/fa'; // 보건
import { GiForkKnifeSpoon } from 'react-icons/gi';
import { IoBag } from 'react-icons/io5';
import { RiCustomerServiceFill } from 'react-icons/ri';
import { IoIosBed, IoLogoGameControllerB } from 'react-icons/io';
import { IconType } from 'react-icons';
import { IndustryCategory } from '../../../types/bottom-menu-types';

import PillButton from '../PillButton';
import IndustryItem from './IndustryItem';

interface Props {
  onClose: () => void;
  categories: IndustryCategory[];
  onSelect: (id: string) => void;
  isLoading: boolean;
}

const IconMap: Record<string, IconType> = {
  I1: GiForkKnifeSpoon, // 음식
  I2: MdMenuBook, // 교육
  I3: FaHospital, // 의료·건강
  I4: IoLogoGameControllerB, // 오락·스포츠
  I5: RiCustomerServiceFill, // 생활서비스
  I6: IoIosBed, // 숙박
  I7: IoBag, // 소매
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
      <div className="grid grid-cols-4 gap-[16px] mt-3 overflow-x-auto pb-2">
        {categories.map(({ code, name }) => {
          const Icon = IconMap[code] ?? IoBag;
          return (
            <div
              key={code}
              className="cursor-pointer"
              onClick={() => onSelect(code)}
            >
              <IndustryItem label={name} iconLabel={Icon} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
