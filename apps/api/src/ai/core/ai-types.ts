import { AreaVectorDto, BusinessCategoryVectorDto } from '../dto/column-vector';

export type AiProviderName = 'openai' | 'claude';
export type AiRole = 'user' | 'assistant';

export interface AiMessage {
  role: AiRole;
  content: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  argsJson: string;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  output: unknown;
  outputJson: string;
}

export interface PlannerContext {
  messages: AiMessage[];
  categories: BusinessCategoryVectorDto[];
  areas: AreaVectorDto[];
}

export interface AnswerContext {
  messages: AiMessage[];
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
}

export interface ToolPlanner {
  planTools(ctx: PlannerContext): Promise<ToolCall[]>;
}

export interface AnswerProvider {
  analyze(ctx: AnswerContext): Promise<string>;
  stream(
    ctx: AnswerContext,
    onDelta: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<string>;
}
