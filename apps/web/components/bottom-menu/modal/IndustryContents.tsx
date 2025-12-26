import { FaBuilding } from 'react-icons/fa'; // 부동산업
import { MdMenuBook, MdScience } from 'react-icons/md'; // 전문/과학
import { MdSupportAgent } from 'react-icons/md'; // 시설관리
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
  I2: GiForkKnifeSpoon, // 음식
  G2: IoBag, // 소매
  S2: RiCustomerServiceFill, // 서비스
  R2: IoLogoGameControllerB, // 오락
  P1: MdMenuBook, // 교육
  I1: IoIosBed, // 숙박
  L1: FaBuilding, // 부동산
  M1: MdScience, // 전문/과학
  N1: MdSupportAgent, // 시설관리
  Q1: FaHospital, // 보건
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
        {categories.map(({ code, name }) => {
          // code가 'food', 'retail' 등과 일치하므로 이를 키로 사용
          const Icon = IconMap[code] ?? IoBag;
          return (
            <div key={code} className="cursor-pointer">
              <IndustryItem label={name} iconLabel={Icon} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
