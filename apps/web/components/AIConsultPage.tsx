"use client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowLeft, Send, Sparkles, TrendingUp, AlertCircle, MapPin } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";
import type { Location } from "@/store/use-app-store";

interface AIConsultPageProps {
  location: Location;
  onBack: () => void;
  onFindAlternative: () => void;
  onViewRealEstate: () => void;
}

type MessageData = {
  commercialScore?: number;
  realEstateScore?: number;
  showAlternative?: boolean;
};

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
  data?: MessageData;
}

export function AIConsultPage({ location, onBack, onFindAlternative, onViewRealEstate }: AIConsultPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: `안녕하세요! ${location.name}에서의 창업을 고민 중이시군요. 상권과 부동산 분석 결과를 바탕으로 상담해드리겠습니다.`,
      timestamp: new Date(),
      data: {
        commercialScore: location.commercialScore,
        realEstateScore: location.realEstateScore,
      },
    },
  ]);
  const [input, setInput] = useState("");

  const predefinedQuestions = [
    "이 지역에 카페를 차리는 게 어떨까요?",
    "임대료가 너무 높은 것 같은데 괜찮을까요?",
    "유동인구는 충분한가요?",
    "경쟁이 심한 편인가요?",
  ];

  const handleSendMessage = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const aiMessage: Message = generateAIResponse(messageText);
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const generateAIResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("카페") || lowerMessage.includes("차리")) {
      return {
        role: "ai",
        content: `${location.name}은 카페 창업에 좋은 조건을 갖추고 있습니다.

**긍정적인 요소:**
• 20-30대 유동인구 비중이 63%로 카페 주 타겟층이 많습니다
• 월 평균 유동인구 ${location.monthlyFootTraffic}으로 충분한 수요가 있습니다
• 트렌디한 이미지로 SNS 마케팅에 유리합니다

**주의할 점:**
• 임대료가 ${location.avgRent}으로 다소 높은 편입니다
• 반경 500m 내 카페가 23개로 경쟁이 치열합니다

예상 월 매출은 약 3,500만원이며, 임대료와 인건비를 고려한 손익분기점은 약 8-10개월입니다.`,
        timestamp: new Date(),
      };
    } else if (lowerMessage.includes("임대료") || lowerMessage.includes("높")) {
      return {
        role: "ai",
        content: `네, ${location.avgRent}은 이 지역에서 다소 높은 수준입니다.

**임대료 분석:**
• 최근 6개월간 15% 상승 추세
• 주변 지역 평균 대비 약 25% 높음
• 그러나 유동인구와 매출을 고려하면 투자 가치는 있습니다

**추천 사항:**
더 저렴하면서 비슷한 상권 특성을 가진 다른 지역을 찾아보시는 것은 어떨까요? AI가 추천하는 대안 지역이 있습니다.`,
        timestamp: new Date(),
        data: {
          showAlternative: true,
        },
      };
    } else if (lowerMessage.includes("유동인구")) {
      return {
        role: "ai",
        content: `${location.name}의 유동인구는 매우 우수한 편입니다!

**유동인구 분석:**
• 월 평균 ${location.monthlyFootTraffic}
• 주말 평균 일 6.5만명, 평일 평균 일 4.8만명
• 최근 6개월간 8% 증가 추세

**시간대별 분포:**
• 오전 (06-12시): 25%
• 오후 (12-18시): 45%
• 저녁 (18-24시): 30%

카페의 주 영업시간인 오후~저녁 시간대에 전체 유동인구의 75%가 집중되어 있어 좋은 조건입니다.`,
        timestamp: new Date(),
      };
    } else if (lowerMessage.includes("경쟁")) {
      return {
        role: "ai",
        content: `${location.name}은 경쟁이 치열한 편입니다.

**경쟁 현황:**
• 반경 500m 내 카페 23개
• 프랜차이즈 8개, 개인 카페 15개
• 최근 1년간 신규 오픈 7개, 폐업 3개

**차별화 전략이 필요합니다:**
• 특색 있는 인테리어나 시그니처 메뉴 필수
• SNS 마케팅과 브랜딩에 투자 필요
• 특정 니치 시장 공략 (예: 디저트, 반려동물 동반 등)

경쟁은 심하지만, 전체 시장 크기가 크고 성장하고 있어 차별화만 잘 되면 충분히 성공할 수 있습니다.`,
        timestamp: new Date(),
      };
    }

    return {
      role: "ai",
      content: `좋은 질문입니다! ${location.name}에 대해 더 구체적으로 알려드리겠습니다. 

현재 이 지역의 상권 점수는 ${location.commercialScore}, 부동산 점수는 ${location.realEstateScore}입니다.

추가로 궁금하신 점이 있으시면 말씀해주세요!`,
      timestamp: new Date(),
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-6">
      <div className="max-w-[1200px] mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>상세 분석으로 돌아가기</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">AI 창업 상담</h1>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {location.name}, {location.district}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-center bg-blue-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-gray-600">상권 점수</div>
                  <div className="text-xl font-bold text-blue-800">{location.commercialScore}</div>
                </div>
                <div className="text-center bg-green-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-gray-600">부동산 점수</div>
                  <div className="text-xl font-bold text-green-700">{location.realEstateScore}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.map((message, idx) => (
              <div key={idx} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] ${message.role === "user" ? "order-2" : ""}`}>
                  {message.role === "ai" && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">지리응답 AI</span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl p-4 ${
                      message.role === "user" ? "bg-blue-950 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="whitespace-pre-line">{message.content}</div>

                    {message.data?.commercialScore && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-300">
                        <Badge className="bg-blue-700 text-white">상권 {message.data.commercialScore}</Badge>
                        <Badge className="bg-green-700 text-white">부동산 {message.data.realEstateScore}</Badge>
                      </div>
                    )}

                    {message.data?.showAlternative && (
                      <Button onClick={onFindAlternative} className="w-full mt-3 bg-blue-950 hover:bg-slate-900">
                        대안 지역 찾아보기
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 px-2">
                    {message.timestamp.toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {messages.length <= 3 && (
            <div className="px-6 pb-4">
              <div className="text-sm text-gray-600 mb-2">추천 질문:</div>
              <div className="flex flex-wrap gap-2">
                {predefinedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(question)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 border-t">
            <div className="flex gap-3">
              <Input
                placeholder="궁금한 점을 물어보세요..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={() => handleSendMessage()} className="bg-blue-800 hover:bg-blue-900">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-6 h-6 text-blue-800" />
              <h3 className="text-xl font-bold">손익분기점 계산</h3>
            </div>
            <p className="text-gray-600 mb-4">예상 매출과 비용을 바탕으로 손익분기점을 계산해보세요</p>
            <Button onClick={onViewRealEstate} className="w-full bg-blue-950 hover:bg-slate-900">
              부동산 & 손익 분석하기
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold">대안 지역 찾기</h3>
            </div>
            <p className="text-gray-600 mb-4">더 저렴하고 비슷한 상권 특성을 가진 지역을 추천받으세요</p>
            <Button onClick={onFindAlternative} variant="outline" className="w-full">
              AI 추천 지역 보기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
