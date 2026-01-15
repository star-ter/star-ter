"use client";

import { Upload, Image, Link2 } from "lucide-react";

/**
 * SuggestedPanel 컴포넌트 - 오른쪽 사이드패널
 *
 * 배열 렌더링 (map):
 * - 배열 데이터를 JSX 요소 목록으로 변환
 * - key prop: React가 각 요소를 식별하는 데 사용 (필수!)
 *
 * 콜백 함수 패턴:
 * - 자식에서 부모로 이벤트 전달
 * - onClick={() => onQuestionClick(q)}: 클릭 시 부모 함수 호출
 */

interface SuggestedPanelProps {
  onQuestionClick: (question: string) => void;
  onTaskClick: (task: string) => void;
}

// 제안 작업 목록 (상권 분석 관련)
const SUGGESTED_TASKS = [
  { id: "1", label: "일정 짜줘", short: "일정 짜줘" },
  { id: "2", label: "대중 교통 설명해줘", short: "대중교통 경로" },
  { id: "3", label: "재정적 관점에서 계획해줘", short: "재정 분석" },
];

// 제안 질문 목록
const SUGGESTED_QUESTIONS = [
  "여기 교통이 안 좋아?",
  "영업일은 언제야?",
  "인파가 싫은데 나한테 괜찮을까?",
  "화장실, 기도실, 휴게실 있어?",
];

export function SuggestedPanel({
  onQuestionClick,
  onTaskClick,
}: SuggestedPanelProps) {
  return (
    <aside className="w-80 bg-white rounded-2xl shadow-lg shrink-0 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Sources 섹션 */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Sources</h3>
          
          {/* 업로드 영역 */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-slate-300 transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mb-1">
              Add from connected knowledge or
            </p>
            <p className="text-sm text-slate-500">upload to thread.</p>
          </div>

          {/* 업로드 버튼들 */}
          <div className="flex gap-2 mt-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Upload file
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
              <Image className="w-3.5 h-3.5" />
              Upload media
            </button>
          </div>

          <button className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-700 transition-colors">
            <Link2 className="w-3.5 h-3.5" />
            Browse existing content
          </button>
        </section>

        {/* Suggested tasks 섹션 */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            Suggested tasks
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TASKS.map((task) => (
              <button
                key={task.id}
                onClick={() => onTaskClick(task.label)}
                className="px-3 py-2 text-xs text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
              >
                {task.short}
              </button>
            ))}
          </div>
        </section>

        {/* Suggested questions 섹션 */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            Suggested questions
          </h3>
          <div className="space-y-1">
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <button
                key={index}
                onClick={() => onQuestionClick(question)}
                className="w-full text-left px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
