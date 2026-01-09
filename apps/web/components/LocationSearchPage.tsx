"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, X, MapPin, TrendingUp, Users, DollarSign, Activity, Star, Coffee, Utensils, ShoppingBag } from "lucide-react";
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
  // --- HOT (10 items) ---
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
    id: "16",
    rank: 16,
    name: "신사동 가로수길",
    district: "신사동 · 패션/뷰티",
    revenue: "4.2억원",
    growthRate: 8.5,
    totalRevenue: "600.0억원",
    ratio: { a: 35, b: 65 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "/assets/sinsadong.jpg",
  },
  {
    id: "17",
    rank: 17,
    name: "익선동 한옥거리",
    district: "종로3가 · 카페/F&B",
    revenue: "2.1억원",
    growthRate: 11.2,
    totalRevenue: "250.0억원",
    ratio: { a: 20, b: 80 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "/assets/ikseondong.jpg",
  },
  {
    id: "18",
    rank: 18,
    name: "서촌 옥인길",
    district: "누하동 · 갤러리/카페",
    revenue: "8,900만원",
    growthRate: 7.4,
    totalRevenue: "110.0억원",
    ratio: { a: 40, b: 60 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1493857671505-72967e2e2760?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "19",
    rank: 19,
    name: "용산 용리단길",
    district: "용산 · 맛집/펍",
    revenue: "1.5억원",
    growthRate: 19.8,
    totalRevenue: "300.0억원",
    ratio: { a: 50, b: 50 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "20",
    rank: 20,
    name: "북촌 한옥마을",
    district: "안국동 · 전통/문화",
    revenue: "1.3억원",
    growthRate: 6.2,
    totalRevenue: "180.0억원",
    ratio: { a: 25, b: 75 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "21",
    rank: 21,
    name: "삼각지 대구탕골목",
    district: "용산 · 노포",
    revenue: "9,200만원",
    growthRate: 5.5,
    totalRevenue: "90.0억원",
    ratio: { a: 60, b: 40 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "22",
    rank: 22,
    name: "혜화 대학로",
    district: "혜화동 · 공연/문화",
    revenue: "2.8억원",
    growthRate: 4.8,
    totalRevenue: "450.0억원",
    ratio: { a: 30, b: 70 },
    status: "뜨는 상권",
    statusType: "hot",
    imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop",
  },

  // --- STABLE (10 items) ---
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
    id: "7",
    rank: 7,
    name: "청담동 명품거리",
    district: "청담동 · 럭셔리",
    revenue: "5.5억원",
    growthRate: 3.2,
    totalRevenue: "1200.0억원",
    ratio: { a: 20, b: 80 },
    status: "안정 상권",
    statusType: "stable",
    imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "8",
    rank: 8,
    name: "광화문 오피스지구",
    district: "종로 · 오피스",
    revenue: "3.1억원",
    growthRate: 1.5,
    totalRevenue: "950.0억원",
    ratio: { a: 70, b: 30 },
    status: "안정 상권",
    statusType: "stable",
    imageUrl: "/assets/gwanghwamun.jpg",
  },
  {
    id: "9",
    rank: 9,
    name: "여의도 IFC몰",
    district: "여의도 · 복합몰",
    revenue: "4.8억원",
    growthRate: 4.1,
    totalRevenue: "1500.0억원",
    ratio: { a: 50, b: 50 },
    status: "안정 상권",
    statusType: "stable",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "14",
    rank: 14,
    name: "잠실 송리단길",
    district: "송파동 · 카페/다이닝",
    revenue: "1.6억원",
    growthRate: 6.5,
    totalRevenue: "350.0억원",
    ratio: { a: 25, b: 75 },
    status: "안정 상권",
    statusType: "stable",
    imageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "23",
    rank: 23,
    name: "삼성동 코엑스",
    district: "삼성동 · 쇼핑/전시",
    revenue: "8.5억원",
    growthRate: 2.1,
    totalRevenue: "2200.0억원",
    ratio: { a: 40, b: 60 },
    status: "안정 상권",
    statusType: "stable",
    imageUrl: "https://images.unsplash.com/photo-1574634534894-89d7576c8259?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "24",
    rank: 24,
    name: "판교 테크노밸리",
    district: "판교 · 오피스/IT",
    revenue: "6.2억원",
    growthRate: 5.4,
    totalRevenue: "1800.0억원",
    ratio: { a: 80, b: 20 },
    status: "안정 상권",
    statusType: "stable",
    imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "25",
    rank: 25,
    name: "강남역 먹자골목",
    district: "서초동 · 유흥/맛집",
    revenue: "12.5억원",
    growthRate: 3.5,
    totalRevenue: "3500.0억원",
    ratio: { a: 55, b: 45 },
    status: "안정 상권",
    statusType: "stable",
    imageUrl: "https://images.unsplash.com/photo-1517604931442-714233452bbc?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "26",
    rank: 26,
    name: "명동 거리",
    district: "명동 · 관광/쇼핑",
    revenue: "9.8억원",
    growthRate: 15.2, // Recovering
    totalRevenue: "2000.0억원",
    ratio: { a: 10, b: 90 },
    status: "안정 상권",
    statusType: "stable",
    imageUrl: "https://images.unsplash.com/photo-1533929736472-594e45aa96d5?q=80&w=800&auto=format&fit=crop",
  },

  // --- VARIABLE (10 items) ---
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
    id: "10",
    rank: 10,
    name: "홍대 클럽거리",
    district: "서교동 · 유흥/클럽",
    revenue: "2.1억원",
    growthRate: 18.5,
    totalRevenue: "600.0억원",
    ratio: { a: 80, b: 20 },
    status: "변동 상권",
    statusType: "variable",
    imageUrl: "/assets/hongdae.jpg",
  },
  {
    id: "11",
    rank: 11,
    name: "건대 맛의거리",
    district: "자양동 · 주점/포차",
    revenue: "1.5억원",
    growthRate: 25.1,
    totalRevenue: "380.0억원",
    ratio: { a: 90, b: 10 },
    status: "변동 상권",
    statusType: "variable",
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "12",
    rank: 12,
    name: "이태원 퀴논길",
    district: "이태원 · 세계음식",
    revenue: "9,800만원",
    growthRate: 14.2,
    totalRevenue: "220.0억원",
    ratio: { a: 60, b: 40 },
    status: "변동 상권",
    statusType: "variable",
    imageUrl: "/assets/itaewon.jpg",
  },
  {
    id: "13",
    rank: 13,
    name: "문래 창작촌",
    district: "문래동 · 예술/펍",
    revenue: "6,500만원",
    growthRate: 28.9,
    totalRevenue: "95.0억원",
    ratio: { a: 40, b: 60 },
    status: "변동 상권",
    statusType: "variable",
    imageUrl: "/assets/mullae.jpg",
  },
  {
    id: "15",
    rank: 15,
    name: "신당 동대문패션",
    district: "신당동 · 의류/도매",
    revenue: "3.5억원",
    growthRate: 11.2,
    totalRevenue: "600.0억원",
    ratio: { a: 40, b: 60 },
    status: "변동 상권",
    statusType: "variable",
    imageUrl: "/assets/sindang.jpg",
  },
  {
    id: "27",
    rank: 27,
    name: "샤로수길 (서울대)",
    district: "봉천동 · 맛집/카페",
    revenue: "7,800만원",
    growthRate: 16.8,
    totalRevenue: "140.0억원",
    ratio: { a: 45, b: 55 },
    status: "변동 상권",
    statusType: "variable",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "28",
    rank: 28,
    name: "해방촌 신흥시장",
    district: "용산동2가 · 펍/카페",
    revenue: "5,400만원",
    growthRate: 21.5,
    totalRevenue: "80.0억원",
    ratio: { a: 30, b: 70 },
    status: "변동 상권",
    statusType: "variable",
    imageUrl: "https://images.unsplash.com/photo-1519671482538-518b76064afc?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "29",
    rank: 29,
    name: "연희동 사러가",
    district: "연희동 · 다이닝",
    revenue: "8,800만원",
    growthRate: 9.5,
    totalRevenue: "150.0억원",
    ratio: { a: 40, b: 60 },
    status: "변동 상권",
    statusType: "variable",
    imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "30",
    rank: 30,
    name: "양양 서피비치",
    district: "강원도 · 서핑/펍",
    revenue: "2.5억원",
    growthRate: 45.2,
    totalRevenue: "500.0억원",
    ratio: { a: 60, b: 40 },
    status: "변동 상권",
    statusType: "variable",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
  }
];



// New Component: LocationDetailModal
function LocationDetailModal({ 
  location, 
  onClose, 
  onNavigate 
}: { 
  location: LocationRankItem; 
  onClose: () => void; 
  onNavigate: () => void; 
}) {
  if (!location) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container (White Mode) */}
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Map Visuals */}
        <div className="relative w-full md:w-2/5 h-64 md:h-auto bg-slate-900 overflow-hidden group">
          {/* User Map Background */}
          <ImageWithFallback
            src="/assets/hannam_map.png" 
            alt="Map View"
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
          />
          {/* Stronger Gradient for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-90" />
          
          {/* Simulated Markers */}
          <div className="absolute inset-0 pointer-events-none">
             {/* Marker 1: Coffee (Center-ish) */}
             <div className="absolute top-[30%] left-[40%] animate-bounce duration-[2000ms]">
                <div className="relative">
                  <span className="absolute -inset-1 rounded-full bg-orange-500/30 animate-ping"></span>
                  <div className="bg-orange-500 p-2 rounded-full shadow-lg shadow-black/20 border-2 border-white/20">
                    <Coffee className="w-4 h-4 text-white" />
                  </div>
                </div>
             </div>

             {/* Marker 2: Food (Bottom Left) */}
             <div className="absolute top-[60%] left-[20%] animate-bounce duration-[2500ms]">
               <div className="relative">
                  <span className="absolute -inset-1 rounded-full bg-pink-500/30 animate-ping delay-75"></span>
                  <div className="bg-pink-500 p-2 rounded-full shadow-lg shadow-black/20 border-2 border-white/20">
                    <Utensils className="w-4 h-4 text-white" />
                  </div>
               </div>
             </div>

             {/* Marker 3: Shopping (Top Right) */}
             <div className="absolute top-[20%] right-[30%] animate-bounce duration-[3000ms]">
                <div className="relative">
                  <span className="absolute -inset-1 rounded-full bg-purple-500/30 animate-ping delay-150"></span>
                  <div className="bg-purple-500 p-2 rounded-full shadow-lg shadow-black/20 border-2 border-white/20">
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                </div>
             </div>

             {/* Marker 4: Coffee (Bottom Right) */}
             <div className="absolute bottom-[30%] right-[20%] animate-bounce duration-[2200ms]">
                <div className="relative">
                  <span className="absolute -inset-1 rounded-full bg-yellow-500/30 animate-ping delay-300"></span>
                  <div className="bg-yellow-500 p-2 rounded-full shadow-lg shadow-black/20 border-2 border-white/20">
                    <Coffee className="w-4 h-4 text-white" />
                  </div>
                </div>
             </div>
          </div>

          <div className="absolute bottom-6 left-6 text-white z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-600 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-blue-500/50">
                2025 분석 완료
              </span>
              <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded border border-white/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                AI Verified
              </span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter leading-none mb-1 drop-shadow-2xl">
              {location.name.split(" ")[0]}
            </h2>
            <p className="text-sm font-medium text-slate-300 flex items-center gap-1">
               <MapPin className="w-3 h-3" /> {location.district}
            </p>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 p-8 flex flex-col overflow-y-auto bg-white">
          {/* Header Info */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold mb-1">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>서울특별시 성동구</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>데이터 신뢰도 99.8%</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm">
              과거 공장지대에서 서울의 브루클린으로 변모한 곳. 평일/주말 구분 없는 안정적인 유동인구와 높은 객단가가 특징입니다. MZ세대를 타겟으로 한 팝업스토어의 성지입니다.
            </p>
          </div>

          {/* AI Insight Box */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Star className="w-24 h-24 text-indigo-500" />
            </div>
            <h3 className="text-indigo-900 font-bold flex items-center gap-2 mb-2 text-sm uppercase tracking-wide">
              <Star className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              AI Analyst Insight
            </h3>
            <p className="text-indigo-800 text-sm font-medium leading-relaxed relative z-10">
              &quot;최근 팝업스토어의 성지로 자리잡으며 외부 유입 인구가 <span className="text-indigo-600 bg-indigo-100 px-1 rounded font-bold">30% 증가</span>했습니다. 대형 카페보다는 특색 있는 소규모 F&B 진입을 추천합니다.&quot;
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> 일일 유동인구
              </div>
              <div className="text-slate-900 font-black text-xl">12.5만<span className="text-sm font-normal text-slate-500 ml-0.5">/일</span></div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> 예상 월매출
              </div>
              <div className="text-slate-900 font-black text-xl">4,500만<span className="text-sm font-normal text-slate-500 ml-0.5">/월</span></div>
            </div>
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> 경쟁 강도
              </div>
              <div className="text-orange-500 font-black text-xl">높음</div>
            </div>
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="text-slate-400 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 성장률 (YoY)
              </div>
              <div className="text-green-600 font-black text-xl">+15%</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto flex gap-3">
             <button 
              className="flex-1 py-4 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4" />
              AI 심층 분석
            </button>
            <button 
              onClick={onNavigate}
              className="flex-[2] py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              상세 정보 보기
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

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
  const extendedData = [...data, ...data, ...data];
  
  // item width 280 + gap 4 = 284
  const ITEM_WIDTH = 280;
  const GAP = 4;
  const SINGLE_SET_WIDTH = data.length * (ITEM_WIDTH + GAP);

  useEffect(() => {
    if (rowRef.current) {
      // Start in the middle set
      rowRef.current.scrollLeft = SINGLE_SET_WIDTH;
    }
  }, [SINGLE_SET_WIDTH]);

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft } = rowRef.current;
      
      // If we reach the start of the first set, jump to start of second
      if (scrollLeft < GAP) { // Using a small buffer instead of 0 for safety
        rowRef.current.scrollLeft = SINGLE_SET_WIDTH + scrollLeft;
      }
      // If we reach the start of the third set, jump to start of second
      else if (scrollLeft >= SINGLE_SET_WIDTH * 2) {
         // Calculate exactly how far into Set 3 we are, and map that to Set 2
         // scrollLeft - SINGLE_SET_WIDTH * 2 = overflow
         // We want SINGLE_SET_WIDTH + overflow
        rowRef.current.scrollLeft = scrollLeft - SINGLE_SET_WIDTH;
      }
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  // Split title into first word and the rest
  const [firstWord, ...rest] = title.split(" ");
  const restOfTitle = rest.join(" ");

  return (
    <div className="mt-8 group/row">
      <h2 className="px-8 text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span>
          <span className="group-hover/row:text-blue-600 transition-colors duration-300">{firstWord}</span>
          {restOfTitle && ` ${restOfTitle}`}
        </span>
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
          onScroll={handleScroll}
          className="flex gap-1 overflow-x-auto px-8 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Ensure scrollbar is hidden in all browsers
        >
          {extendedData.map((item, index) => (
            <button
              key={`${title}-${index}-${item.id}`}
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

                <h2 className="text-2xl font-black text-white group-hover/card:text-blue-400 uppercase tracking-tighter leading-none italic mb-1 drop-shadow-sm transition-colors duration-300">
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
  const [selectedLocation, setSelectedLocation] = useState<LocationRankItem | null>(null);

  // Categorize data
  const hotLocations = rankData.filter((i) => i.statusType === "hot");
  const stableLocations = rankData.filter((i) => i.statusType === "stable");
  const variableLocations = rankData.filter((i) => i.statusType === "variable");
  const allLocations = rankData;

  const categories = [
    { title: "인기 상권", data: hotLocations },
    { title: "요즘 뜨는 상권", data: stableLocations },
    { title: "2030 저격 상권", data: variableLocations },
    { title: "직장인구 폭발 상권", data: allLocations },
  ];

  const handleCardClick = (loc: LocationRankItem) => {
    setSelectedLocation(loc);
  };

  const handleNavigate = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation);
    }
  };

  return (
    <div className="flex flex-1 flex-col h-screen bg-[#f7f7f8] overflow-hidden relative">
      {/* Detail Modal */}
      {selectedLocation && (
        <LocationDetailModal 
          location={selectedLocation} 
          onClose={() => setSelectedLocation(null)} 
          onNavigate={handleNavigate}
        />
      )}

      {/* Header Section */}
      <div className={`flex-shrink-0 px-8 py-6 bg-white border-b border-gray-200 z-10 transition-all duration-300 ${selectedLocation ? 'blur-sm scale-[0.98]' : ''}`}>
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
      <div className={`flex-1 overflow-y-auto no-scrollbar pb-10 transition-all duration-300 ${selectedLocation ? 'blur-sm scale-[0.99] grayscale-[0.5]' : ''}`}>
        {categories.map((category) => (
          <CategoryRow 
            key={category.title} 
            title={category.title} 
            data={category.data} 
            onSelectLocation={handleCardClick} 
          />
        ))}
      </div>
    </div>
  );
}
