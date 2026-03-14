"use client";

export type ConfigState = {
  llm_provider: "gemini" | "openai" | "groq" | "fireworks";
  breadth: number;
  depth: number;

  // Optional BYOK:
  llm_api_key: string;
  firecrawl_api_key: string;
};

export default function ConfigPanel({
  value,
  onChange,
}: {
  value: ConfigState;
  onChange: (v: ConfigState) => void;
}) {
  return (
    <div>
      <div className="text-[11px] font-bold tracking-[0.2em] text-zinc-500">
        CONFIGURATION
      </div>

      <div className="mt-2 grid gap-2">
        <label className="text-[11px] font-semibold text-zinc-500">LLM Provider</label>
        <select
          className="w-full rounded-md border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-sm"
          value={value.llm_provider}
          onChange={(e) =>
            onChange({ ...value, llm_provider: e.target.value as any })
          }
        >
          <option value="gemini">gemini</option>
          <option value="openai">openai</option>
          <option value="groq">groq</option>
          <option value="fireworks">fireworks</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-zinc-500">Breadth</label>
            <input
              type="number"
              min={1}
              max={10}
              className="mt-1 w-full rounded-md border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-sm"
              value={value.breadth}
              onChange={(e) => onChange({ ...value, breadth: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-zinc-500">Depth</label>
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full rounded-md border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-sm"
              value={value.depth}
              onChange={(e) => onChange({ ...value, depth: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Optional BYOK inputs (remove for production if backend stores keys) */}
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-zinc-500">
            API Keys (BYOK - optional)
          </summary>

          <div className="mt-2 grid gap-2">
            <input
              type="password"
              placeholder="LLM API Key"
              className="w-full rounded-md border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-sm"
              value={value.llm_api_key}
              onChange={(e) => onChange({ ...value, llm_api_key: e.target.value })}
            />
            <input
              type="password"
              placeholder="Firecrawl API Key"
              className="w-full rounded-md border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-sm"
              value={value.firecrawl_api_key}
              onChange={(e) => onChange({ ...value, firecrawl_api_key: e.target.value })}
            />
          </div>
        </details>
      </div>
    </div>
  );
}