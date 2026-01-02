import Link from 'next/link';
import { BsFillPeopleFill, BsGraphUpArrow } from 'react-icons/bs';
import { PiMoneyWavyFill } from 'react-icons/pi';
import { FaShop } from 'react-icons/fa6';
import { FaBalanceScale, FaRobot } from 'react-icons/fa';

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full overflow-y-auto">
      <header className="flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50">
        <h1 className="text-2xl font-black text-blue-600 tracking-tighter cursor-pointer">
          STAR-TER
        </h1>
      </header>
      <section className="relative flex flex-col items-center justify-center py-32 px-4 text-center bg-linear-to-b from-blue-50 to-white">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl moving-blob"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl moving-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <h5 className="text-blue-600 font-bold tracking-wider uppercase text-sm animate-fade-in-up">
            데이터 기반 의사결정 도우미
          </h5>
          <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight animate-fade-in-up animation-delay-100">
            명당을 찾아주는 <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
              상권분석 서비스 Star-ter
            </span>
          </h2>
          <div className="text-xl text-gray-600 max-w-2xl mx-auto space-y-2 animate-fade-in-up animation-delay-200">
            <p>빅데이터와 AI 기술로 최적의 창업 입지를 찾아드립니다.</p>
            <p>
              실시간 유동인구, 매출 데이터, 경쟁업체 정보를 한눈에 확인하세요.
            </p>
          </div>
          <div className="pt-8 animate-fade-in-up animation-delay-300">
            <Link href={'/map'}>
              <button className="cursor-pointer px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                상권 분석하러 가기 →
              </button>
            </Link>
          </div>
        </div>
      </section>

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

      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              어떻게 작동하나요?
            </h2>
            <p className="text-lg text-gray-600">
              3단계로 간단하게 상권을 분석하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-200 -z-0"></div>
            {[
              {
                step: 1,
                title: '지역 및 업종 검색',
                desc: '원하는 지역을 검색하거나 지도에서 직접 선택하세요.',
              },
              {
                step: 2,
                title: '데이터 분석',
                desc: '해당 지역의 매출, 인구, 경쟁 정보를 분석하세요.',
              },
              {
                step: 3,
                title: '의사 결정',
                desc: 'AI가 제공하는 종합 리포트로 최적의 창업 결정을 내리세요.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 border-4 border-white text-2xl font-black text-blue-600 ring-1 ring-gray-100">
                  {item.step}
                </div>
                <h5 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h5>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto bg-linear-to-r from-indigo-600 to-blue-600 rounded-[3rem] p-12 md:p-20 text-center shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 relative z-10 leading-tight">
            AI 에이전트와 대화를 통해
            <br />
            상권분석에 대한 고민을 나눠보세요.
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            단순한 데이터 조회를 넘어, 당신의 상황에 맞는 맞춤형 조언을
            제공합니다.
          </p>
        </div>
      </section>

      <section className="py-24 text-center bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            지금 바로 상권분석을 시작하세요
          </h2>
          <Link href={'/map'}>
            <button className="cursor-pointer px-12 py-5 bg-gray-900 text-white text-xl font-bold rounded-full hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl">
              상권 분석하러 가기 →
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
