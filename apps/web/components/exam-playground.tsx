'use client';

import { useMemo, useState } from "react";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
type FieldTarget = "path" | "body";

type FieldDefinition = {
  key: string;
  label: string;
  placeholder?: string;
  helper?: string;
  required?: boolean;
  type?: "text" | "number";
  target: FieldTarget;
};

type EndpointDefinition = {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  fields?: FieldDefinition[];
};

type ExecutionResult = {
  type: "success" | "error";
  status?: number;
  ok?: boolean;
  body: string;
  timestamp: string;
  url?: string;
};

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const METHOD_THEME: Record<HttpMethod, string> = {
  GET: "border-emerald-400/30 text-emerald-300 bg-emerald-400/10",
  POST: "border-sky-400/30 text-sky-300 bg-sky-400/10",
  PATCH: "border-amber-400/30 text-amber-300 bg-amber-400/10",
  DELETE: "border-rose-400/30 text-rose-300 bg-rose-400/10",
};

const ENDPOINTS: EndpointDefinition[] = [
  {
    id: "list",
    method: "GET",
    path: "/exam",
    summary: "Exam 전체 목록",
    description: "생성해 둔 모든 exam 행을 배열로 돌려줍니다.",
  },
  {
    id: "detail",
    method: "GET",
    path: "/exam/:id",
    summary: "Exam 단건 조회",
    description: "ID를 기준으로 하나의 exam을 반환합니다.",
    fields: [
      {
        key: "id",
        label: "Exam ID",
        placeholder: "예) 1",
        required: true,
        type: "number",
        target: "path",
      },
    ],
  },
  {
    id: "create",
    method: "POST",
    path: "/exam",
    summary: "Exam 생성",
    description: "number 필드 하나만 전달하면 새 exam을 생성합니다.",
    fields: [
      {
        key: "number",
        label: "number",
        placeholder: "예) 42",
        required: true,
        type: "number",
        target: "body",
      },
    ],
  },
  {
    id: "update",
    method: "PATCH",
    path: "/exam/:id",
    summary: "Exam 수정",
    description: "ID에 해당하는 exam의 number 값을 변경합니다.",
    fields: [
      {
        key: "id",
        label: "Exam ID",
        placeholder: "예) 1",
        required: true,
        type: "number",
        target: "path",
      },
      {
        key: "number",
        label: "number",
        placeholder: "예) 77",
        helper: "비워두면 변경되지 않습니다.",
        type: "number",
        target: "body",
      },
    ],
  },
  {
    id: "delete",
    method: "DELETE",
    path: "/exam/:id",
    summary: "Exam 삭제",
    description: "ID에 해당하는 exam을 제거합니다.",
    fields: [
      {
        key: "id",
        label: "Exam ID",
        placeholder: "예) 1",
        required: true,
        type: "number",
        target: "path",
      },
    ],
  },
];

const METHOD_WITH_BODY: HttpMethod[] = ["POST", "PATCH"];

export default function ExamPlayground() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6">
        <header className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-900/40 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Exam REST Playground
          </p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">
            Swagger 없이도 exam API를 바로 호출해 보세요
          </h1>
          <p className="text-base leading-relaxed text-slate-200">
            NestJS `exam` 컨트롤러의 CRUD 흐름을 빠르게 확인할 수 있도록
            만들어진 간단한 호출 도구입니다. Next.js App Router의 Client
            Component로 구성되어 결과를 즉시 확인할 수 있습니다.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              API Base URL
            </label>
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="http://localhost:4000"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
            />
            <p className="text-xs text-slate-400">
              서버를 `pnpm dev --filter api` 등으로 띄운 뒤 기본 포트를 입력하면
              됩니다. URL 끝의 슬래시는 자동으로 정리됩니다.
            </p>
          </div>
        </header>

        <section className="grid gap-6">
          {ENDPOINTS.map((endpoint) => (
            <EndpointCard
              key={endpoint.id}
              definition={endpoint}
              baseUrl={baseUrl}
            />
          ))}
        </section>
      </div>
    </div>
  );
}

function EndpointCard({
  definition,
  baseUrl,
}: {
  definition: EndpointDefinition;
  baseUrl: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (definition.fields ?? []).map((field) => [field.key, ""])
    )
  );
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const methodClass = useMemo(
    () => METHOD_THEME[definition.method] ?? "border-white/10",
    [definition.method]
  );

  const handleChange = (key: string, nextValue: string) => {
    setValues((previous) => ({ ...previous, [key]: nextValue }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const timestamp = new Date().toLocaleString("ko-KR");

    try {
      const missingField = (definition.fields ?? []).find(
        (field) => field.required && !String(values[field.key] ?? "").trim()
      );

      if (missingField) {
        setResult({
          type: "error",
          body: `${missingField.label} 값을 먼저 입력하세요.`,
          timestamp,
        });
        return;
      }

      const resolvedPath = buildPath(definition.path, values);
      const requestUrl = joinUrl(baseUrl, resolvedPath);

      const payload = collectBodyPayload(definition.fields ?? [], values);
      const hasBody =
        METHOD_WITH_BODY.includes(definition.method) &&
        Object.keys(payload).length > 0;

      const response = await fetch(requestUrl, {
        method: definition.method,
        headers: hasBody ? { "Content-Type": "application/json" } : undefined,
        body: hasBody ? JSON.stringify(payload) : undefined,
      });

      const rawText = await response.text();
      const formattedBody = formatBody(rawText);

      setResult({
        type: response.ok ? "success" : "error",
        status: response.status,
        ok: response.ok,
        body: formattedBody,
        timestamp,
        url: requestUrl,
      });
    } catch (error) {
      setResult({
        type: "error",
        body:
          error instanceof Error
            ? error.message
            : "요청 도중 알 수 없는 오류가 발생했습니다.",
        timestamp,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-xl shadow-black/30"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${methodClass}`}
        >
          {definition.method}
        </span>
        <code className="rounded-2xl bg-black/40 px-4 py-1 text-sm text-slate-200">
          {definition.path}
        </code>
      </div>
      <div>
        <p className="text-lg font-semibold text-white">
          {definition.summary}
        </p>
        <p className="text-sm text-slate-400">{definition.description}</p>
      </div>

      {definition.fields && definition.fields.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {definition.fields.map((field) => (
            <label key={field.key} className="space-y-1 text-sm">
              <span className="text-slate-200">
                {field.label}
                {field.required && <span className="text-rose-300"> *</span>}
              </span>
              <input
                value={values[field.key] ?? ""}
                inputMode={field.type === "number" ? "numeric" : undefined}
                type={field.type === "number" ? "number" : "text"}
                placeholder={field.placeholder}
                onChange={(event) => handleChange(field.key, event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-base text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
              {field.helper && (
                <span className="block text-xs text-slate-400">
                  {field.helper}
                </span>
              )}
            </label>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "요청 중..." : `${definition.method} 호출 실행`}
      </button>

      {result && (
        <div className="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{result.timestamp}</span>
            {typeof result.status === "number" && (
              <span>
                HTTP {result.status}
                {typeof result.ok === "boolean" &&
                  (result.ok ? " (success)" : " (error)")}
              </span>
            )}
            {result.url && <span>{result.url}</span>}
          </div>
          <pre className="max-h-60 overflow-auto rounded-xl bg-black/60 p-4 text-sm text-slate-100">
            {result.body}
          </pre>
        </div>
      )}
    </form>
  );
}

function buildPath(template: string, values: Record<string, string>) {
  return template.replace(/:([a-zA-Z]+)/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined || value === null || value === "") {
      throw new Error(`${key} 경로 변수를 입력하세요.`);
    }
    return encodeURIComponent(value);
  });
}

function joinUrl(baseUrl: string, path: string) {
  if (!baseUrl.trim()) {
    throw new Error("API Base URL을 입력하세요.");
  }
  const normalizedBase = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function collectBodyPayload(
  fields: FieldDefinition[],
  values: Record<string, string>
) {
  return fields
    .filter((field) => field.target === "body")
    .reduce<Record<string, unknown>>((payload, field) => {
      const value = values[field.key];
      if (value === undefined || value === "") {
        return payload;
      }
      payload[field.key] = field.type === "number" ? Number(value) : value;
      return payload;
    }, {});
}

function formatBody(text: string) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text || "(내용 없음)";
  }
}
