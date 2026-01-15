"use client";

import { Share, Edit3, Copy, MoreHorizontal, Bot } from "lucide-react";
import { ChartRenderer, type ChartAction } from "./charts";

/**
 * ChatMessage 컴포넌트 - 개별 메시지 렌더링
 *
 * 조건부 렌더링:
 * - message.role에 따라 다른 스타일 적용
 * - "user": 사용자 메시지 (오른쪽 정렬, 파란색 배경)
 * - "assistant": AI 메시지 (왼쪽 정렬, 흰색 배경)
 * 
 * 차트 렌더링:
 * - AI 메시지에서 chartActions가 있으면 말풍선 안에 차트 표시
 */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  chartActions?: ChartAction[]; // 차트 액션 (AI 메시지용)
}

export function ChatMessage({ message, chartActions }: ChatMessageProps) {
  const isUser = message.role === "user";

  // 차트 액션만 필터링
  const chartOnlyActions = chartActions?.filter(
    (a) => a.type.startsWith("chart.") || a.type.startsWith("list.")
  );

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-4xl ${
          isUser
            ? "bg-blue-900 text-slate-800 rounded-2xl rounded-br-md px-8 py-6"
            : "bg-white rounded-2xl shadow-sm border border-slate-100 px-8 py-6"
        }`}
      >
        {/* AI 메시지에 Results 헤더 추가 */}
        {!isUser && (
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-6 h-6 text-slate-400" />
            <span className="text-lg font-medium text-slate-600">AI Assistant</span>
          </div>
        )}


        {/* 메시지 내용 (숨겨진 markers 텍스트 제거하고 표시) */}
        <div
          className={`text-lg leading-relaxed whitespace-pre-wrap ${
            isUser ? "text-white font-semibold" : "text-slate-700"
          }`}
        >
          {message.content.split('\n\n[매물 목록 참조용')[0]}
        </div>

        {/* 차트 렌더링 (AI 메시지만, 말풍선 안) */}
        {!isUser && chartOnlyActions && chartOnlyActions.length > 0 && (
          <ChartRenderer actions={chartOnlyActions} className="mt-4 -mx-2" />
        )}

        {/* AI 메시지에 액션 버튼 추가 */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
              <Share className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
              <Edit3 className="w-4 h-4" />
              Rewrite
            </button>
            <div className="flex-1" />
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

