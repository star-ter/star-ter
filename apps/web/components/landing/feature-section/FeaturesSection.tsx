'use client';

import { useState } from 'react';
import Image from 'next/image';
import bigdata from './img/db_img.png';
import ai from './img/ai_img.png';
import recommend from './img/estate_img.png';

const FEATURES = [
  {
    id: 'bigdata',
    label: '빅데이터 상권',
    title: '정교한 상권 데이터 분석',
    image: bigdata,
    description: (
      <>
        안정적인 정보제공을 위해 Alley는 공공데이터를 이용합니다.
        <br />
        단순한 정보 제공을 넘어, AI가 당신의 성공 가능성을 수치로 보여줍니다.
      </>
    ),
  },
  {
    id: 'ai',
    label: 'AI 예측',
    title: '미래 가치까지 예측하는 AI',
    image: ai,
    description: (
      <>
        과거 데이터를 바탕으로 미래를 데이터를 예측합니다
        <br />
        Alley의 알고리즘이 향후 상권 성장성을 예측해드립니다.
      </>
    ),
  },
  {
    id: 'recommend',
    label: '상가 추천',
    title: '업종에 딱 맞는 상가 찾기',
    image: recommend,
    description: (
      <>
        데이터를 바탕으로 조건에 맞는 알맞은 매물을 찾아냅니다.
        <br />
        권리금 분석부터 임대료까지, 부동산 정보들을 제공합니다.
      </>
    ),
  },
];

export function FeaturesSection() {
  const [activeTab, setActiveTab] = useState(0);
  const feature = FEATURES[activeTab];

  return (
    <section className="py-24 px-6 bg-muted/60">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                {FEATURES.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(index)}
                    className={`text-caption px-3 py-1 rounded-full transition-colors ${
                      activeTab === index
                        ? 'bg-background border border-border shadow-sm font-bold text-primary'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <h2 className="text-display font-heading mb-8 text-primary">
                {feature.title}
              </h2>
              <p className="text-muted-foreground mb-6 text-h5 leading-relaxed min-h-[84px]">
                {feature.description}
              </p>
            </div>

            <div className="p-2 bg-background rounded-3xl shadow-xl border border-border transition-all duration-300 h-[520px] flex items-center justify-center overflow-hidden">
              <figure className="w-full h-full bg-background rounded-2xl flex items-center justify-center relative">
                <Image
                  src={feature.image}
                  alt={feature.label}
                  className="object-contain rounded-2xl"
                  fill
                />
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
