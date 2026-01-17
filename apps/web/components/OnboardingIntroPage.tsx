'use client';

import { Button } from './ui/button';
import { Logo } from './landing/header/Logo';
import { UserCircle, Store, BarChart3, ArrowLeft } from 'lucide-react';

interface OnboardingIntroPageProps {
  onStart: () => void;
  onBack?: () => void;
}

export function OnboardingIntroPage({
  onStart,
  onBack,
}: OnboardingIntroPageProps) {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="px-4 py-6 flex items-center justify-between shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">뒤로</span>
          </button>
        )}
        <Logo className="h-8" />
        <div className="w-20"></div>
      </header>

      <div className="flex-1 flex flex-col justify-center px-[5%] py-[3vh] overflow-y-auto">
        <div className="max-w-[1200px] w-full mx-auto mb-[8vh] text-center">
          <h2 className="text-display font-bold text-foreground mb-[2vh]">
            상권 분석을 쉽게 시작하세요
          </h2>
          <p className="text-h4 text-muted-foreground">
            당신의 나이, 선호 지역, 운영 시간, 자본금을 기반으로 맞춤형 업종과
            최적의 창업 지역을 추천해드립니다.
          </p>
        </div>

        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-4">
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div
                className="w-[clamp(300px,30vw,380px)] aspect-square shrink-0 rounded-2xl bg-card border border-border p-[6%] flex flex-col justify-between"
                style={{
                  animation:
                    'float 3s ease-in-out infinite, glow 2s ease-in-out infinite alternate',
                  boxShadow:
                    '0 10px 40px -10px rgba(59, 130, 246, 0.3), 0 4px 20px rgba(0, 0, 0, 0.08)',
                }}
              >
                <style>{`
                  @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                  }
                  @keyframes glow {
                    0% { box-shadow: 0 10px 40px -10px rgba(30, 58, 138, 0.2), 0 4px 20px rgba(0, 0, 0, 0.08); }
                    100% { box-shadow: 0 10px 50px -10px rgba(30, 58, 138, 0.4), 0 4px 25px rgba(0, 0, 0, 0.1); }
                  }
                `}</style>
                <div className="space-y-1">
                  <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-tiny font-bold text-white bg-primary">
                    추천
                  </div>
                  <h3 className="mt-1 text-h3 font-bold text-foreground">
                    홍대입구역(홍대)
                  </h3>
                  <p className="text-h5 font-strong text-muted-foreground">
                    서울
                  </p>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-caption font-strong text-muted-foreground mb-1">
                      매칭 점수
                    </p>
                    <div className="flex items-end gap-0.5">
                      <span className="text-h2 font-heading text-primary">
                        91.2
                      </span>
                      <span className="text-body font-bold text-primary">
                        점
                      </span>
                    </div>
                  </div>
                  <div className="relative right-3">
                    <div
                      className="relative"
                      style={{ width: '160px', height: '160px' }}
                    >
                      <svg width="160" height="160" viewBox="0 0 160 160">
                        <polygon
                          points="80,24 133,63 113,125 47,125 27,63"
                          fill="none"
                          stroke="var(--border)"
                          strokeWidth="1"
                        ></polygon>
                        <polygon
                          points="80,52 107,71 96,103 64,103 53,71"
                          fill="none"
                          stroke="var(--border)"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        ></polygon>
                        <line
                          x1="80"
                          y1="80"
                          x2="80"
                          y2="24"
                          stroke="var(--border)"
                          strokeWidth="1"
                        ></line>
                        <line
                          x1="80"
                          y1="80"
                          x2="133"
                          y2="63"
                          stroke="var(--border)"
                          strokeWidth="1"
                        ></line>
                        <line
                          x1="80"
                          y1="80"
                          x2="113"
                          y2="125"
                          stroke="var(--border)"
                          strokeWidth="1"
                        ></line>
                        <line
                          x1="80"
                          y1="80"
                          x2="47"
                          y2="125"
                          stroke="var(--border)"
                          strokeWidth="1"
                        ></line>
                        <line
                          x1="80"
                          y1="80"
                          x2="27"
                          y2="63"
                          stroke="var(--border)"
                          strokeWidth="1"
                        ></line>
                        <polygon
                          points="80,36 133,63 113,125 47,125 45,69"
                          fill="var(--primary)"
                          fillOpacity="0.25"
                          stroke="var(--primary)"
                          strokeWidth="1.5"
                        ></polygon>
                        <circle
                          cx="80"
                          cy="36"
                          r="2.5"
                          fill="var(--primary)"
                        ></circle>
                        <circle
                          cx="133"
                          cy="63"
                          r="2.5"
                          fill="var(--primary)"
                        ></circle>
                        <circle
                          cx="113"
                          cy="125"
                          r="2.5"
                          fill="var(--primary)"
                        ></circle>
                        <circle
                          cx="47"
                          cy="125"
                          r="2.5"
                          fill="var(--primary)"
                        ></circle>
                        <circle
                          cx="45"
                          cy="69"
                          r="2.5"
                          fill="var(--primary)"
                        ></circle>
                      </svg>
                      <div
                        className="absolute text-tiny font-strong text-muted-foreground whitespace-nowrap"
                        style={{
                          left: '80px',
                          top: '12px',
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        타깃 연령
                      </div>
                      <div
                        className="absolute text-tiny font-strong text-muted-foreground whitespace-nowrap"
                        style={{
                          left: '145px',
                          top: '60px',
                          transform: 'translate(0%, -50%)',
                        }}
                      >
                        창업 비용
                      </div>
                      <div
                        className="absolute text-tiny font-strong text-muted-foreground whitespace-nowrap"
                        style={{
                          left: '121px',
                          top: '135px',
                          transform: 'translate(0%, -50%)',
                        }}
                      >
                        상권 테마
                      </div>
                      <div
                        className="absolute text-tiny font-strong text-muted-foreground whitespace-nowrap"
                        style={{
                          left: '39px',
                          top: '135px',
                          transform: 'translate(-100%, -50%)',
                        }}
                      >
                        운영 시간
                      </div>
                      <div
                        className="absolute text-tiny font-strong text-muted-foreground whitespace-nowrap"
                        style={{
                          left: '15px',
                          top: '60px',
                          transform: 'translate(-100%, -50%)',
                        }}
                      >
                        업종 적합
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="space-y-[5vh] max-w-lg mx-auto lg:mx-0">
              <div className="flex gap-[1.5vw]">
                <div className="shrink-0 p-[3%] rounded-2xl">
                  <UserCircle size={40} className="w-12 h-12 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-h3 font-bold text-foreground mb-[1vh]">
                    기본 정보 입력
                  </h3>
                  <p className="text-muted-foreground text-h5 leading-relaxed">
                    나이, 선호 지역, 운영 시간 등 기본 정보를 알려주세요.
                  </p>
                </div>
              </div>

              <div className="flex gap-[1.5vw]">
                <div className="shrink-0  p-[3%] rounded-2xl">
                  <Store size={40} className="w-12 h-12 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-h3 font-bold text-foreground mb-[1vh]">
                    업종 선택
                  </h3>
                  <p className="text-muted-foreground text-h5 leading-relaxed">
                    창업하고 싶은 업종을 선택하면 맞춤 분석을 제공합니다.
                  </p>
                </div>
              </div>

              <div className="flex gap-[1.5vw]">
                <div className="shrink-0 p-[3%] rounded-2xl">
                  <BarChart3 size={40} className="w-12 h-12 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-h3 font-bold text-foreground mb-[1vh]">
                    상세 분석 확인
                  </h3>
                  <p className="text-muted-foreground text-h5 leading-relaxed">
                    AI 기반 상권 분석과 맞춤 지역 추천을 받아보세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t">
        <div className="max-w-7xl mx-auto flex justify-end">
          <Button
            onClick={onStart}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-7 rounded-lg text-lg font-medium cursor-pointer"
          >
            시작하기
          </Button>
        </div>
      </div>
    </div>
  );
}
