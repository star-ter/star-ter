import Link from 'next/link';

export default function HeroSection() {
  return (
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
  );
}
