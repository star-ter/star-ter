import { MdMenuBook, MdStorefront } from 'react-icons/md'; // 교육, 식료품
// import { MdSupportAgent } from 'react-icons/md'; // 시설관리 (Unused)
import { FaHospital, FaTv } from 'react-icons/fa'; // 보건, 리빙가전
import { GiForkKnifeSpoon } from 'react-icons/gi';
import { IoBag, IoShirt } from 'react-icons/io5';
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
  I2: GiForkKnifeSpoon, // 음식
  P1: MdMenuBook, // 교육
  Q1: FaHospital, // 의료·건강
  R1: IoLogoGameControllerB, // 오락·스포츠
  F1: IoShirt, // 패션·뷰티
  K1: MdStorefront, // 식료품
  H1: FaTv, // 리빙·가전
  S2: RiCustomerServiceFill, // 생활서비스
  I1: IoIosBed, // 숙박
  G2: IoBag, // 소매
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
      <div className="grid grid-cols-5 gap-[16px] mt-3 overflow-x-auto pb-2">
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
