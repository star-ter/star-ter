import { BsFillPeopleFill, BsGraphUpArrow } from 'react-icons/bs';
import { PiMoneyWavyFill } from 'react-icons/pi';
import { FaShop } from 'react-icons/fa6';
import { FaBalanceScale, FaRobot } from 'react-icons/fa';

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 max-w-7xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          모든 데이터를 한곳에서
        </h2>
        <p className="text-lg text-gray-600">
          창업 성공에 도움을 줄 정보들을 제공합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            icon: <BsFillPeopleFill />,
            title: '유동인구 분석',
            desc: '시간/요일/연령별 인구 분포를 지도 위에서 히트맵으로 확인',
          },
          {
            icon: <PiMoneyWavyFill />,
            title: '업종별 매출 분석',
            desc: '데이터를 기반으로 한 정확한 분기별 매출 추이',
          },
          {
            icon: <FaShop />,
            title: '경쟁업체 분석',
            desc: '주변 동일 업종 점포 수와 증감 추이를 파악하여 경쟁 강도를 진단',
          },
          {
            icon: <BsGraphUpArrow />,
            title: '상권 트렌드',
            desc: '뜨는 상권부터 지는 상권까지, 빅데이터가 분석한 상권의 활력도를 확인',
          },
          {
            icon: <FaBalanceScale />,
            title: '지역별 비교 분석',
            desc: '관심 있는 두 지역을 나란히 비교하여 더 나은 입지를 선택하도록 도움',
          },
          {
            icon: <FaRobot />,
            title: 'AI 의사결정 가이드',
            desc: '복잡한 데이터 속에서 AI가 핵심 인사이트와 행동 가이드를 제안',
          },
        ].map((feature, idx) => (
          <div
            key={idx}
            className="group p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300"
          >
            <div className="text-4xl mb-6 bg-blue-50 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform duration-300">
              {feature.icon}
            </div>
            <h5 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              {feature.title}
            </h5>
            <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
