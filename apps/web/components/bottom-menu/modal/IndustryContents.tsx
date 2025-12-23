import { GiForkKnifeSpoon } from 'react-icons/gi';
import { IoBag } from 'react-icons/io5';
import { RiCustomerServiceFill } from 'react-icons/ri';
import { IoLogoGameControllerB } from 'react-icons/io';
import { MdMenuBook } from 'react-icons/md';
import { IoIosBed } from 'react-icons/io';

export default function IndustryContents({ onClose }: { onClose: () => void }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">업종</h3>
        <button
          className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-100"
          type="button"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-400">
        지도에 표시할 업종을 선택하세요
      </p>
      <div className="flex gap-[16px] mt-3">
        <div className="industry-btn flex flex-col items-center">
          <figure className="icon">
            <GiForkKnifeSpoon size={40} color="#99a1af" />
          </figure>
          <p className="text-gray-400">음식</p>
        </div>
        <div className="industry-btn flex flex-col items-center">
          <figure className="icon">
            <IoBag size={40} color="#99a1af" />
          </figure>
          <p className="text-gray-400">소메</p>
        </div>
        <div className="industry-btn flex flex-col items-center">
          <figure className="icon">
            <RiCustomerServiceFill size={40} color="#99a1af" />
          </figure>
          <p className="text-gray-400">서비스</p>
        </div>
        <div className="industry-btn flex flex-col items-center">
          <figure className="icon">
            <IoLogoGameControllerB size={40} color="#99a1af" />
          </figure>
          <p className="text-gray-400">오락</p>
        </div>
        <div className="industry-btn flex flex-col items-center">
          <figure className="icon">
            <MdMenuBook size={40} color="#99a1af" />
          </figure>
          <p className="text-gray-400">교육</p>
        </div>
        <div className="industry-btn flex flex-col items-center">
          <figure className="icon">
            <IoIosBed size={40} color="#99a1af" />
          </figure>
          <p className="text-gray-400">숙박</p>
        </div>
      </div>
    </section>
  );
}
