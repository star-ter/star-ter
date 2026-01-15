import { TrendingUp, Flame, Users, CircleDollarSign } from "lucide-react";

interface ChatWelcomeProps {
  onSuggestionClick: (message: string) => void;
}

export function ChatWelcome({ onSuggestionClick }: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-4">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
        <svg
          className="w-10 h-10 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        무엇을 도와드릴까요?
      </h2>
      <p className="text-lg text-slate-500 text-center mb-10 max-w-lg">
        상권 분석부터 창업 상세 견적까지,<br className="hidden sm:block" />
        AI 전문가에게 무엇이든 물어보세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <button
          onClick={() => onSuggestionClick("강남구 역세권 치킨집 상권 분석해줘")}
          className="text-left p-7 rounded-3xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-xl transition-all group flex flex-col items-start"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-slate-600" />
            <span className="text-xl font-bold text-slate-800 group-hover:text-slate-600">상권 분석</span>
          </div>
          <span className="block text-base text-slate-500">강남구 역세권 치킨집 상권 분석해줘</span>
        </button>
        <button
          onClick={() => onSuggestionClick("서울시 뜨는 상권 추천해줘")}
          className="text-left p-7 rounded-3xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-xl transition-all group flex flex-col items-start"
        >
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-8 h-8 text-slate-600" />
            <span className="text-xl font-bold text-slate-800 group-hover:text-slate-600">뜨는 상권</span>
          </div>
          <span className="block text-base text-slate-500">서울시 뜨는 상권 추천해줘</span>
        </button>
        <button
          onClick={() => onSuggestionClick("마포구 유동인구 많은 곳 알려줘")}
          className="text-left p-7 rounded-3xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-xl transition-all group flex flex-col items-start"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-slate-600" />
            <span className="text-xl font-bold text-slate-800 group-hover:text-slate-600">유동인구</span>
          </div>
          <span className="block text-base text-slate-500">마포구 유동인구 많은 곳 알려줘</span>
        </button>
        <button
          onClick={() => onSuggestionClick("성수동 카페 창업 비용 견적 내줘")}
          className="text-left p-7 rounded-3xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-xl transition-all group flex flex-col items-start"
        >
          <div className="flex items-center gap-3 mb-2">
            <CircleDollarSign className="w-8 h-8 text-slate-600" />
            <span className="text-xl font-bold text-slate-800 group-hover:text-slate-600">창업 비용</span>
          </div>
          <span className="block text-base text-slate-500">성수동 카페 창업 비용 견적 내줘</span>
        </button>
      </div>
    </div>
  );
}
