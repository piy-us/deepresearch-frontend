export type AgentConfig = {
  breadth: number;
  depth: number;
  llm_provider: "gemini" | "openai" | "groq" | "fireworks";

  // Optional BYOK (not recommended). Only send if your backend expects it.
  llm_api_key?: string;
  firecrawl_api_key?: string;
};

const base = process.env.NEXT_PUBLIC_API_BASE_URL;

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function generateFollowups(query: string, config: AgentConfig) {
  return postJSON<{ questions: string[] }>("/v1/followups", { query, config });
}

export async function runResearch(
  query: string,
  follow_up_answers: string[],
  config: AgentConfig
) {
  return postJSON<{ result: any }>("/v1/run", { query, follow_up_answers, config });
}

export async function saveReport(
  report_markdown: string,
  filename: string,
  config: AgentConfig
) {
  return postJSON<{ saved: boolean; filename: string }>("/v1/reports/save", {
    report_markdown,
    filename,
    config,
  });
}