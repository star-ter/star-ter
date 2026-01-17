import type { AiAction, AiResponse } from "@/lib/api/ai";
import type { ChartAction } from "@/components/chat/charts";
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


export function splitActions(actions?: AiAction[]) {
  const chartActions: ChartAction[] = [];
  const otherActions: AiAction[] = [];

  if (!actions) {
    return { chartActions, otherActions };
  }

  for (const action of actions) {
    if (isChartActionType(action.type)) {
      chartActions.push(action as ChartAction);
    } else {
      otherActions.push(action);
    }
  }

  return { chartActions, otherActions };
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
  const chartActions = getChartActions(parsed?.actions);
  const reply = parsed?.reply?.trim() ? parsed.reply : params.content;

  return {
    id: params.id,
    role: "assistant",
    content: reply,
    timestamp,
    chartActions,
  };
}

export function buildMessageFromAiResponse(params: {
  id: string;
  response: AiResponse;
  timestamp?: Date;
  contentOverride?: string;
  chartActions?: ChartAction[];
}): Message {
  const timestamp = params.timestamp ?? new Date();
  const chartActions =
    params.chartActions ?? getChartActions(params.response.actions);
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
    chartActions,
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

function getChartActions(actions?: AiAction[]): ChartAction[] | undefined {
  if (!actions) return undefined;
  const filtered = actions.filter((action) => isChartActionType(action.type));
  return filtered.length ? (filtered as ChartAction[]) : undefined;
}

function isChartActionType(type: string) {
  return type.startsWith("chart.") || type.startsWith("list.");
}
