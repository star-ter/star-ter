'use client';

import { useState } from 'react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
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
        안정적인 정보제공을 위해 지리응답은 공공데이터를 이용합니다.
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
        지리응답의 알고리즘이 향후 상권 성장성을 예측해드립니다.
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
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                {FEATURES.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(index)}
                    className={`text-sm px-3 py-1 rounded-full transition-colors ${
                      activeTab === index
                        ? 'bg-white border border-gray-300 shadow-sm font-medium text-blue-900'
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <h2 className="text-4xl font-extrabold min-h-[80px]">
                {feature.title}
              </h2>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed min-h-[84px]">
                {feature.description}
              </p>
            </div>

            <div className="p-2 bg-white rounded-3xl shadow-xl border border-gray-100 transition-all duration-300 h-[520px] flex items-center justify-center overflow-hidden">
              <figure className="w-full h-full bg-white rounded-2xl flex items-center justify-center text-slate-400 font-bold text-lg">
                <img
                  src={feature.image.src}
                  alt={feature.label}
                  className="object-cover rounded-2xl"
                />
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
