import type { AiAction, AiResponse } from "@/lib/api/ai";
import type { ChartItem } from "@/components/chat/charts";
import type { Message } from "@/components/chat/types";

type MessageBaseParams = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
};

export function parseAiResponseText(text: string): AiResponse | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    return coerceAiResponse(parsed);
  } catch {
    return null;
  }
}

export function buildMessageFromAiText(params: MessageBaseParams): Message {
  const timestamp = params.timestamp ?? new Date();

  if (params.role !== "assistant") {
    return {
      id: params.id,
      role: params.role,
      content: params.content,
      timestamp,
    };
  }

  const parsed = parseAiResponseText(params.content);
  const reply = parsed?.reply?.trim() ? parsed.reply : params.content;

  return {
    id: params.id,
    role: "assistant",
    content: reply,
    timestamp,
  };
}

export function buildMessageFromAiResponse(params: {
  id: string;
  response: AiResponse;
  timestamp?: Date;
  contentOverride?: string;
  chartItems?: ChartItem[];
}): Message {
  const timestamp = params.timestamp ?? new Date();
  const content = params.contentOverride ?? params.response.reply ?? "";

  // sources 매핑
  const sources = params.response.sources?.map((s) => ({
    tool: s.tool,
    displayName: s.displayName,
    source: s.source,
  }));

  return {
    id: params.id,
    role: "assistant",
    content,
    timestamp,
    chartItems: params.chartItems,
    sources,
  };
}

function coerceAiResponse(value: unknown): AiResponse | null {
  if (typeof value !== "object" || value === null) return null;
  const data = value as {
    reply?: unknown;
    actions?: unknown;
    artifacts?: unknown;
    suggestedPrompts?: unknown;
  };

  const hasReply = typeof data.reply === "string";
  const hasActions = Array.isArray(data.actions);
  if (!hasReply && !hasActions) return null;

  return {
    reply: hasReply ? data.reply as string : "",
    actions: hasActions ? (data.actions as AiAction[]) : [],
    artifacts: Array.isArray(data.artifacts)
      ? (data.artifacts as AiResponse["artifacts"])
      : undefined,
    suggestedPrompts: Array.isArray(data.suggestedPrompts)
      ? (data.suggestedPrompts as string[])
      : undefined,
  };
}
