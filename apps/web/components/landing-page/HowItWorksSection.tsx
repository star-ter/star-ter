export default function HowItWorksSection() {
  return (
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
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-200 z-0"></div>
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
  );
}
