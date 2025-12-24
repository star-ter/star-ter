import { GiForkKnifeSpoon } from 'react-icons/gi';
import { IoBag } from 'react-icons/io5';
import { RiCustomerServiceFill } from 'react-icons/ri';
import { IoLogoGameControllerB } from 'react-icons/io';
import { MdMenuBook } from 'react-icons/md';
import { IoIosBed } from 'react-icons/io';

import PillButton from '../PillButton';

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
        <div className="industry-btn flex flex-col items-center group cursor-pointer">
          <figure className="icon">
            <GiForkKnifeSpoon className="h-10 w-10 text-gray-400 transition group-hover:text-gray-800" />
          </figure>
          <p className="text-gray-400 transition group-hover:text-gray-800">
            음식
          </p>
        </div>
        <div className="industry-btn flex flex-col items-center group cursor-pointer">
          <figure className="icon">
            <IoBag className="h-10 w-10 text-gray-400 transition group-hover:text-gray-800" />
          </figure>
          <p className="text-gray-400 transition group-hover:text-gray-800">
            소메
          </p>
        </div>
        <div className="industry-btn flex flex-col items-center group cursor-pointer">
          <figure className="icon">
            <RiCustomerServiceFill className="h-10 w-10 text-gray-400 transition group-hover:text-gray-800" />
          </figure>
          <p className="text-gray-400 transition group-hover:text-gray-800">
            서비스
          </p>
        </div>
        <div className="industry-btn flex flex-col items-center group cursor-pointer">
          <figure className="icon">
            <IoLogoGameControllerB className="h-10 w-10 text-gray-400 transition group-hover:text-gray-800" />
          </figure>
          <p className="text-gray-400 transition group-hover:text-gray-800">
            오락
          </p>
        </div>
        <div className="industry-btn flex flex-col items-center group cursor-pointer">
          <figure className="icon">
            <MdMenuBook className="h-10 w-10 text-gray-400 transition group-hover:text-gray-800" />
          </figure>
          <p className="text-gray-400 transition group-hover:text-gray-800">
            교육
          </p>
        </div>
        <div className="industry-btn flex flex-col items-center group cursor-pointer">
          <figure className="icon">
            <IoIosBed className="h-10 w-10 text-gray-400 transition group-hover:text-gray-800" />
          </figure>
          <p className="text-gray-400 transition group-hover:text-gray-800">
            숙박
          </p>
        </div>
      </div>
    </section>
  );
}
