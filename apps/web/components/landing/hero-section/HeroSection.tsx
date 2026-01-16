import Link from 'next/link';
import { Button } from '../../ui/button';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import dummyMap from './img/dummy_map.png';
import authBg from '../../img/auth_bg.png';

export function HeroSection() {
  return (
    <section>
      <div className="w-screen h-screen flex items-center justify-center px-4 relative bg-[#F9FAFB]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[2px] opacity-70"
          style={{ backgroundImage: `url(${authBg.src})` }}
        />
        <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10 w-full max-w-[1200px]">
          <div className="max-w-xl">
            <h1 className="text-display font-heading text-gray-900 mb-6 leading-[1.15]">
              상권을 묻고, 데이터로 답한다
              <br />
              <span className="text-blue-900">지리응답</span>
            </h1>
            <p className="text-h5 text-gray-900 mb-12 font-medium leading-relaxed">
              빅데이터와 AI가 분석하는 가장 정밀한 상권 리포트.
              <br />
              예상 매출액부터 유동인구, 경쟁사 분석까지 한 번에 확인하세요.
            </p>
            <div className="flex gap-4">
              <Button
                asChild
                className="bg-blue-950 hover:bg-slate-900 text-white px-10 py-7 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all"
              >
                <Link href="/login">시작하기</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-blue-100/50 blur-3xl rounded-full -z-10"></div>
            <div className="bg-white p-3 rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden group">
              <div className="relative h-[480px] rounded-4xl overflow-hidden">
                <ImageWithFallback
                  src={dummyMap.src}
                  alt="성수동 카페거리"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>

                <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                  <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-white/20">
                    <div className="text-caption font-strong text-gray-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      성수동 카페거리 일대
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 grid grid-cols-2 gap-3">
                  <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-lg border border-white/20">
                    <div className="text-tiny text-gray-500 mb-1">
                      일 평균 유동인구
                    </div>
                    <div className="text-body font-bold text-gray-900">
                      142,500명
                    </div>
                    <div className="text-tiny text-green-600 font-bold">
                      ▲ 12.4%
                    </div>
                  </div>
                  <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-lg border border-white/20">
                    <div className="text-tiny text-gray-500 mb-1">
                      예상 월 매출액
                    </div>
                    <div className="text-body font-bold text-gray-900">
                      ₩4,280만
                    </div>
                    <div className="text-tiny text-blue-600 font-bold">
                      신뢰도 98% 분석 완료
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/3 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center animate-ping"></div>
                    <div className="absolute inset-0 w-12 h-12 flex items-center justify-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
