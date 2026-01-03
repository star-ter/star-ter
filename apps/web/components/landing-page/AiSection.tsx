import { FaRobot, FaHourglassHalf } from 'react-icons/fa';
import { IoPerson } from 'react-icons/io5';

export default function AiSection() {
  return (
    <section className="py-24 px-4 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto bg-linear-to-r from-indigo-600 to-blue-600 rounded-[3rem] p-8 md:p-20 text-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            AI 에이전트와 대화를 통해
            <br />
            상권분석에 대한 고민을 나눠보세요.
          </h2>
          <p className="text-blue-100 text-lg mb-12 max-w-2xl mx-auto">
            단순한 데이터 조회를 넘어, 당신의 상황에 맞는 맞춤형 조언을
            제공합니다.
          </p>

          {/* Chat Mockup Container */}
          <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-xl text-left">
            <div className="flex flex-col gap-4">
              {/* User Message */}
              <div className="flex gap-3 items-end justify-end">
                <div className="bg-blue-500 text-white px-5 py-3 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]">
                  <p className="text-sm md:text-base">
                    강남역 근처 카페 창업 어때?
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs overflow-hidden shrink-0">
                  <IoPerson size={20} />
                </div>
              </div>

              {/* AI Message */}
              <div className="flex gap-3 items-end">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg shadow-sm shrink-0">
                  <FaRobot size={20} />
                </div>
                <div className="bg-white text-gray-800 px-5 py-3 rounded-2xl rounded-tl-none shadow-md max-w-[85%]">
                  <p className="text-sm md:text-base font-medium mb-1">
                    Star-ter AI
                  </p>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    강남역 주변은 유동인구가 많지만 경쟁이 매우 치열합니다.{' '}
                    <br />
                    <span className="text-blue-600 font-bold">
                      월 저녁 매출 1위
                    </span>
                    인 역삼 1동 이면도로 상권을 추천드려요. 폐업률이 강남역 대비{' '}
                    <span className="text-red-500 font-bold">
                      15% 낮습니다.
                    </span>
                  </p>
                </div>
              </div>

              {/* Pending Message Animation */}
              <div className="flex gap-3 items-end">
                <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-lg shadow-sm shrink-0">
                  <FaHourglassHalf size={20} />
                </div>
                <div className="bg-white/80 text-gray-500 px-4 py-2 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-150"></span>
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
