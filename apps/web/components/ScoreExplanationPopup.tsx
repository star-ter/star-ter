'use client';

import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

type ScoreExplanationPopupProps = {
  onClose: () => void;
};

export function ScoreExplanationPopup({ onClose }: ScoreExplanationPopupProps) {
  return (
    <>
      <motion.div
        key="score-explanation-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <motion.div
        key="score-explanation-popup"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className="fixed inset-0 z-50 flex h-full w-full flex-col bg-background shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[85vh] sm:w-[min(800px,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-border"
      >
        {/* 헤더 */}
        <div className="px-6 py-5 border-b border-border sm:px-8 sm:py-6 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-h4 font-black text-foreground">
                점수 계산 방식
              </h2>
              <p className="text-body text-foreground">
                맞춤 추천 점수가 어떻게 계산되는지 알아보세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 sm:px-8 sm:py-6">
          {/* 가중치 안내 */}
          <div className="bg-muted rounded-2xl p-4">
            <p className="text-body text-foreground">
              총 100점 만점으로 각 항목별 가중치가 적용됩니다.
            </p>
            <div className="flex flex-wrap justify-between gap-3 mt-3">
              <span className="px-3 py-1.5 bg-background rounded-lg text-caption font-medium">
                타깃 연령 20%
              </span>
              <span className="px-3 py-1.5 bg-background rounded-lg text-caption font-medium">
                상권 테마 20%
              </span>
              <span className="px-3 py-1.5 bg-background rounded-lg text-caption font-medium">
                운영 시간 10%
              </span>
              <span className="px-3 py-1.5 bg-background rounded-lg text-caption font-medium">
                창업 비용 30%
              </span>
              <span className="px-3 py-1.5 bg-background rounded-lg text-caption font-medium">
                업종 적합 20%
              </span>
            </div>
          </div>

          {/* 1. 타깃 연령 */}
          <section className="space-y-2">
            <h3 className="text-body font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-caption font-bold flex items-center justify-center">
                1
              </span>
              타깃 연령
            </h3>
            <div className="pl-8 space-y-2">
              <p className="text-body text-foreground">
                선택한 연령대가 해당 상권에서 차지하는 매출 비중을 기준으로
                산정합니다.
              </p>
              <p className="text-body text-foreground">
                해당 연령대의 소비가 활발한 상권일수록 높은 점수를 받습니다.
              </p>
              <div className="bg-muted rounded-lg p-3 text-caption text-foreground">
                ✓ 만점 조건: 해당 연령대 매출 비중 33% 이상
              </div>
            </div>
          </section>

          {/* 2. 상권 테마 */}
          <section className="space-y-2">
            <h3 className="text-body font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-caption font-bold flex items-center justify-center">
                2
              </span>
              상권 테마
            </h3>
            <div className="pl-8 space-y-2">
              <p className="text-body text-foreground">
                선택한 테마의 특성과 상권이 얼마나 부합하는지를 기준으로
                산정합니다.
              </p>
              <div className="grid grid-cols-2 gap-2 text-caption">
                <div className="bg-muted rounded-lg p-2.5">
                  <div className="font-medium text-foreground">오피스</div>
                  <div className="text-foreground mt-0.5">
                    직장인구 비율 기준
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <div className="font-medium text-foreground">주거지역</div>
                  <div className="text-foreground mt-0.5">
                    거주인구 비율 기준
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <div className="font-medium text-foreground">상업지역</div>
                  <div className="text-foreground mt-0.5">
                    유동인구 비율 기준
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <div className="font-medium text-foreground">대학가</div>
                  <div className="text-foreground mt-0.5">
                    20대 유동인구 비율 + 대학 유무
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <div className="font-medium text-foreground">역세권</div>
                  <div className="text-foreground mt-0.5">지하철역 유무</div>
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <div className="font-medium text-foreground">관광지</div>
                  <div className="text-foreground mt-0.5">집객시설 수 기준</div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. 운영 시간 */}
          <section className="space-y-2">
            <h3 className="text-body font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-caption font-bold flex items-center justify-center">
                3
              </span>
              운영 시간
            </h3>
            <div className="pl-8 space-y-2">
              <p className="text-body text-foreground">
                희망 운영 시간대에 상권 매출이 얼마나 집중되는지를 기준으로
                산정합니다.
              </p>
              <p className="text-body text-foreground">
                해당 시간대 매출 비중이 높을수록 점수가 올라갑니다.
              </p>
              <div className="bg-muted rounded-lg p-3 text-caption text-foreground">
                ✓ 만점 조건: 해당 시간대 매출 비중 50% 이상
              </div>
            </div>
          </section>

          {/* 4. 창업 비용 */}
          <section className="space-y-2">
            <h3 className="text-body font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-caption font-bold flex items-center justify-center">
                4
              </span>
              창업 비용
            </h3>
            <div className="pl-8 space-y-2">
              <p className="text-body text-foreground">
                입력한 자본금으로 해당 상권의 예상 창업비용을 감당할 수 있는지를
                기준으로 산정합니다.
              </p>
              <div className="bg-muted rounded-lg p-3 text-caption text-foreground">
                ✓ 만점 조건: 자본금이 예상 창업비용(보증금 + 1년 임대료) 이상
              </div>
            </div>
          </section>

          {/* 5. 업종 적합도 */}
          <section className="space-y-2">
            <h3 className="text-body font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-caption font-bold flex items-center justify-center">
                5
              </span>
              업종 적합도
              <span className="text-caption text-foreground font-normal">
                (업종 선택 시)
              </span>
            </h3>
            <div className="pl-8 space-y-2">
              <p className="text-body text-foreground">
                선택한 업종이 해당 상권에서 성공 가능성이 있는지를 기준으로
                산정합니다.
              </p>
              <p className="text-body text-foreground">
                경쟁 업체가 적고, 해당 업종 수요가 높은 상권일수록 높은 점수를
                받습니다.
              </p>
              <div className="grid grid-cols-1 gap-1.5 text-caption">
                <div className="bg-muted rounded-lg p-2.5">
                  <span className="font-medium text-foreground">
                    매출 경쟁도:
                  </span>
                  <span className="text-foreground ml-2">
                    해당 업종의 매출 점유율이 낮을수록 유리
                  </span>
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <span className="font-medium text-foreground">
                    밀도 경쟁도:
                  </span>
                  <span className="text-foreground ml-2">
                    해당 업종의 점포 밀도가 낮을수록 유리
                  </span>
                </div>
                <div className="bg-muted rounded-lg p-2.5">
                  <span className="font-medium text-foreground">
                    수요 점수:
                  </span>
                  <span className="text-foreground ml-2">
                    서울 평균 대비 매출이 높을수록 유리
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end sm:px-8 sm:py-5 shrink-0">
          <Button onClick={onClose}>확인</Button>
        </div>
      </motion.div>
    </>
  );
}
