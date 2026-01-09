"use client";

import { useRef } from "react";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface LocationRankItem {
  id: string;
  rank: number;
  name: string;
  district: string;
  revenue: string;
  growthRate: number;
  totalRevenue: string;
  ratio: { a: number; b: number };
  status: string;
  statusType: "stable" | "danger" | "hot" | "variable";
  imageUrl: string;
}

const rankData: LocationRankItem[] = [
  {
    id: "1",
    rank: 1,
    name: "성수동 연무장길",
    district: "성수동 · 카페/팝업",
    revenue: "1.2억원",
    growthRate: 15.4,
    totalRevenue: "420.0억원",
    ratio: { a: 45, b: 55 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "2",
    rank: 2,
    name: "압구정 로데오",
    district: "신사동 · 다이닝/바",
    revenue: "2.5억원",
    growthRate: 8.2,
    totalRevenue: "850.0억원",
    ratio: { a: 48, b: 52 },
    status: "안정 상권",
    statusType: "stable",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "3",
    rank: 3,
    name: "한남동 독서당로",
    district: "한남동 · 라이프스타일",
    revenue: "1.8억원",
    growthRate: 12.5,
    totalRevenue: "310.0억원",
    ratio: { a: 42, b: 58 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "4",
    rank: 4,
    name: "을지로 힙지로",
    district: "을지로 · 노포/펍",
    revenue: "9,500만원",
    growthRate: 22.4,
    totalRevenue: "215.0억원",
    ratio: { a: 60, b: 40 },
    status: "변동 상권",
    statusType: "variable",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "5",
    rank: 5,
    name: "연남동 경의선숲길",
    district: "연남동 · 디저트/베이커리",
    revenue: "8,200만원",
    growthRate: 5.8,
    totalRevenue: "180.0억원",
    ratio: { a: 35, b: 65 },
    status: "안정 상권",
    statusType: "stable",
    imageUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "6",
    rank: 6,
    name: "망원동 망리단길",
    district: "망원동 · 소품샵/카페",
    revenue: "7,400만원",
    growthRate: 9.1,
    totalRevenue: "120.0억원",
    ratio: { a: 30, b: 70 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "7",
    rank: 6,
    name: "망원동 망리단길",
    district: "망원동 · 소품샵/카페",
    revenue: "7,400만원",
    growthRate: 9.1,
    totalRevenue: "120.0억원",
    ratio: { a: 30, b: 70 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "8",
    rank: 6,
    name: "망원동 망리단길",
    district: "망원동 · 소품샵/카페",
    revenue: "7,400만원",
    growthRate: 9.1,
    totalRevenue: "120.0억원",
    ratio: { a: 30, b: 70 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "9",
    rank: 6,
    name: "망원동 망리단길",
    district: "망원동 · 소품샵/카페",
    revenue: "7,400만원",
    growthRate: 9.1,
    totalRevenue: "120.0억원",
    ratio: { a: 30, b: 70 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "10",
    rank: 6,
    name: "망원동 망리단길",
    district: "망원동 · 소품샵/카페",
    revenue: "7,400만원",
    growthRate: 9.1,
    totalRevenue: "120.0억원",
    ratio: { a: 30, b: 70 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "11",
    rank: 6,
    name: "망원동 망리단길",
    district: "망원동 · 소품샵/카페",
    revenue: "7,400만원",
    growthRate: 9.1,
    totalRevenue: "120.0억원",
    ratio: { a: 30, b: 70 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "12",
    rank: 6,
    name: "망원동 망리단길",
    district: "망원동 · 소품샵/카페",
    revenue: "7,400만원",
    growthRate: 9.1,
    totalRevenue: "120.0억원",
    ratio: { a: 30, b: 70 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "13",
    rank: 6,
    name: "망원동 망리단길",
    district: "망원동 · 소품샵/카페",
    revenue: "7,400만원",
    growthRate: 9.1,
    totalRevenue: "120.0억원",
    ratio: { a: 30, b: 70 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=800&auto=format&fit=crop",
  },
];

function CategoryRow({ 
  title, 
  data, 
  onSelectLocation 
}: { 
  title: string; 
  data: LocationRankItem[]; 
  onSelectLocation: (loc: LocationRankItem) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="mt-8 group/row">
      <h2 className="px-8 text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        {title}
        <span className="text-sm font-normal text-slate-400 cursor-pointer hover:text-slate-600">View all</span>
        <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover/row:opacity-100 transition-opacity" />
      </h2>
      
      <div className="relative group">
        {/* Left Arrow */}
        <button 
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-4 z-20 w-11 bg-black/50 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white backdrop-blur-sm rounded-r-lg"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* Content Row - Hide Scrollbar */}
        <div 
          ref={rowRef}
          className="flex gap-1 overflow-x-auto px-8 pb-4 scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Ensure scrollbar is hidden in all browsers
        >
          {data.map((item) => (
            <button
              key={`${title}-${item.id}`}
              onClick={() => onSelectLocation(item)}
              className="group/card relative flex-none w-[280px] aspect-[4/5] overflow-hidden bg-white cursor-pointer first:rounded-l-lg last:rounded-r-lg"
            >
              {/* Image Layer */}
              <div className="absolute inset-0 transition-transform duration-700 group-hover/card:scale-105">
                <ImageWithFallback
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover filter grayscale group-hover/card:grayscale-0 transition-all duration-500"
                />
              </div>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover/card:opacity-70 transition-opacity duration-500" />

              {/* Top Badge */}
              <div className="absolute top-4 left-4">
                <div className="px-3 py-1 border border-white/40 rounded-full backdrop-blur-md bg-white/10">
                  <span className="text-[10px] font-bold text-white tracking-[0.2em]">
                    RANK {item.rank.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>

              {/* Bottom Content */}
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <div className="flex items-center gap-2 mb-2 opacity-0 group-hover/card:opacity-100 transform translate-y-4 group-hover/card:translate-y-0 transition-all duration-500 font-medium">
                  <div className="flex items-center gap-1 text-xs text-blue-300 tracking-wider uppercase">
                    {item.statusType === "hot" && "Trending"}
                    {item.statusType === "stable" && "Steady"}
                    {item.statusType === "variable" && "Volatile"}
                    {item.growthRate > 0 ? `+${item.growthRate}%` : `${item.growthRate}%`}
                  </div>
                </div>

                <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic mb-1 drop-shadow-sm">
                  {item.name.split(" ")[0]}
                </h2>
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest group-hover/card:text-white transition-colors">
                  {item.district.split("·")[0]}
                </p>
              </div>

              {/* Hover Line */}
              <div className="absolute bottom-4 right-4 w-8 h-[2px] bg-blue-500 transform scale-x-0 group-hover/card:scale-x-100 transition-transform duration-500 origin-left" />
            </button>
          ))}
        </div>

        {/* Right Arrow */}
        <button 
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-4 z-20 w-11 bg-black/50 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white backdrop-blur-sm rounded-l-lg"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

export function LocationSearchPage({
  onBack,
  onSelectLocation,
}: {
  onBack?: () => void;
  onSelectLocation: (loc: LocationRankItem) => void;
}) {
  // Categorize data
  const hotLocations = rankData.filter((i) => i.statusType === "hot");
  const stableLocations = rankData.filter((i) => i.statusType === "stable");
  const variableLocations = rankData.filter((i) => i.statusType === "variable");
  const allLocations = rankData;

  const categories = [
    { title: "인기 상권", data: hotLocations },
    { title: "요즘 뜨는 상권", data: stableLocations },
    { title: "2030 저격 상권", data: variableLocations },
    { title: "직장 인구 폭발 상권", data: allLocations },
  ];

  return (
    <div className="flex flex-1 flex-col h-screen bg-[#f7f7f8] overflow-hidden">
      {/* Header Section */}
      <div className="flex-shrink-0 px-8 py-6 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full border border-gray-200 text-slate-500 hover:text-slate-900 hover:border-gray-400 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              Star<span className="text-blue-600">Ter</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 border border-gray-200 rounded-full text-xs font-bold text-slate-500 tracking-widest uppercase bg-gray-50">
              Seoul, KR
            </div>
            <div className="px-3 py-2 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors cursor-pointer shadow-lg shadow-blue-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Netflix-style Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {categories.map((category) => (
          <CategoryRow 
            key={category.title} 
            title={category.title} 
            data={category.data} 
            onSelectLocation={onSelectLocation} 
          />
        ))}
      </div>
    </div>
  );
}
