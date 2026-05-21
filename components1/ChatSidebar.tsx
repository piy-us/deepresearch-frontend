"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

/* ─── Types ──────────────────────────────────────── */
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  chips?: { label: string; action: string }[];
};

export type ConfigState = {
  llm_provider: "gemini" | "openai" | "groq" | "fireworks";
  breadth: number;
  depth: number;
  llm_api_key: string;
  firecrawl_api_key: string;
};

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void | Promise<void>;
  onChipClick: (action: string) => void | Promise<void>;
  loading: boolean;
  config: ConfigState;
  onConfigChange: (v: ConfigState) => void;
}

/* ─── Shared styles ──────────────────────────────── */
const labelCss: React.CSSProperties = {
  display: "block", color: "#3e3e3e", fontSize: "0.68rem", fontWeight: 600,
  fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em",
  textTransform: "uppercase", marginBottom: "5px",
};

const inputCss: React.CSSProperties = {
  width: "100%", background: "#161616", border: "1px solid #2a2a2a",
  borderRadius: "7px", color: "#d0d0d0", fontSize: "0.84rem",
  padding: "7px 10px", outline: "none",
  fontFamily: "'IBM Plex Sans', sans-serif", transition: "border-color 0.15s",
};

/* ─── Loading dots ───────────────────────────────── */
function LoadingDots() {
  return (
    <div style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: "5px", height: "5px", borderRadius: "50%", background: "#555",
          display: "inline-block",
          animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ─── Avatar ─────────────────────────────────────── */
function Avatar({ role }: { role: "user" | "assistant" }) {
  return (
    <div style={{
      width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
      background: role === "assistant" ? "rgba(192,57,0,0.12)" : "rgba(232,100,0,0.12)",
      border: `1px solid ${role === "assistant" ? "#7a2400" : "#8a3a00"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.72rem",
    }}>
      {role === "assistant" ? "🤖" : "👤"}
    </div>
  );
}

/* ─── Main component ─────────────────────────────── */
export default function ChatSidebar({ messages, onSend, onChipClick, loading, config, onConfigChange }: Props) {
  const [text, setText] = useState("");
  const [configOpen, setConfigOpen] = useState(false); // closed by default
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit() {
    const t = text.trim();
    if (!t || loading) return;
    setText("");
    await onSend(t);
  }

  const providers = ["gemini", "openai", "groq", "fireworks"] as const;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%",
      background: "var(--panel)",
      borderRight: "1px solid var(--border)",
      overflow: "hidden",
    }}>

      {/* ── Config expander ─────────────────── */}
      <div style={{ borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <button
          onClick={() => setConfigOpen((o) => !o)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "8px",
            padding: "12px 16px", background: "none", border: "none",
            cursor: "pointer", color: "#666", fontSize: "0.78rem",
            fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: "0.05em", textAlign: "left",
          }}
        >
          {/* Gear icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          <span style={{ flex: 1 }}>Configuration &amp; API Keys</span>
          {/* Chevron — bigger and clear */}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{
              flexShrink: 0, color: "#555",
              transform: configOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Config body */}
        <div style={{
          overflow: "hidden",
          maxHeight: configOpen ? "400px" : "0",
          transition: "max-height 0.25s ease",
        }}>
          <div style={{ padding: "0 16px 14px", display: "grid", gap: "10px" }}>
            {/* Provider */}
            <div>
              <label style={labelCss}>LLM Provider</label>
              <select
                value={config.llm_provider}
                onChange={(e) => onConfigChange({ ...config, llm_provider: e.target.value as any })}
                style={{
                  ...inputCss,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%23555' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                }}
              >
                {providers.map((p) => (
                  <option key={p} value={p} style={{ background: "#161616" }}>{p}</option>
                ))}
              </select>
            </div>

            {/* Breadth + Depth */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <label style={labelCss}>Breadth</label>
                <input type="number" min={1} max={10} value={config.breadth}
                  onChange={(e) => onConfigChange({ ...config, breadth: +e.target.value })}
                  style={inputCss} />
              </div>
              <div>
                <label style={labelCss}>Depth</label>
                <input type="number" min={1} max={5} value={config.depth}
                  onChange={(e) => onConfigChange({ ...config, depth: +e.target.value })}
                  style={inputCss} />
              </div>
            </div>

            {/* Keys */}
            <div>
              <label style={labelCss}>LLM API Key</label>
              <input type="password" placeholder="sk-… / AIza…"
                value={config.llm_api_key}
                onChange={(e) => onConfigChange({ ...config, llm_api_key: e.target.value })}
                style={inputCss} />
            </div>
            <div>
              <label style={labelCss}>Firecrawl API Key</label>
              <input type="password" placeholder="fc-…"
                value={config.firecrawl_api_key}
                onChange={(e) => onConfigChange({ ...config, firecrawl_api_key: e.target.value })}
                style={inputCss} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Chat label ──────────────────────── */}
      <div style={{
        padding: "9px 16px", fontSize: "0.63rem", fontWeight: 700,
        letterSpacing: "0.14em", color: "#2e2e2e",
        fontFamily: "'IBM Plex Mono', monospace",
        borderBottom: "1px solid var(--border)", flexShrink: 0,
      }}>
        CHAT INTERFACE
      </div>

      {/* ── Messages ────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "14px 12px",
        display: "flex", flexDirection: "column", gap: "10px",
        /* Ensure messages area scrolls independently of the drawer */
        WebkitOverflowScrolling: "touch",
      }}>
        {messages.map((m, i) => (
          <div key={i}>
            <div style={{
              display: "flex", gap: "8px", alignItems: "flex-start",
              flexDirection: m.role === "user" ? "row-reverse" : "row",
            }}>
              <Avatar role={m.role} />
              <div style={{
                maxWidth: "88%",
                background: m.role === "assistant" ? "var(--msg-ai)" : "var(--msg-user)",
                border: `1px solid ${m.role === "assistant" ? "var(--msg-ai-border)" : "var(--msg-user-border)"}`,
                borderRadius: m.role === "assistant" ? "3px 10px 10px 10px" : "10px 3px 10px 10px",
                padding: "8px 12px",
              }}>
                <div className="chat-prose">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Action chips */}
            {m.chips && m.chips.length > 0 && (
              <div style={{
                display: "flex", gap: "7px", marginTop: "8px",
                marginLeft: "34px", flexWrap: "wrap",
              }}>
                {m.chips.map((chip) => (
                  <button
                    key={chip.action}
                    onClick={() => onChipClick(chip.action)}
                    disabled={loading}
                    className="action-chip"
                    style={{
                      padding: "5px 13px", background: "#1a1a1a",
                      border: "1px solid #2a2a2a", borderRadius: "20px",
                      color: "#888", fontSize: "0.76rem", fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                      fontFamily: "'IBM Plex Mono', monospace",
                      letterSpacing: "0.02em", transition: "all 0.15s",
                      opacity: loading ? 0.4 : 1,
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <Avatar role="assistant" />
            <div style={{
              background: "var(--msg-ai)", border: "1px solid var(--msg-ai-border)",
              borderRadius: "3px 10px 10px 10px", padding: "10px 14px",
            }}>
              <LoadingDots />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Chat input ──────────────────────── */}
      <div style={{
        borderTop: "1px solid var(--border)",
        padding: "12px",
        flexShrink: 0,
        background: "var(--panel)",
        /* Ensure input is always above any overlay on mobile */
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            }}
            placeholder="Type your query, answer, 'generate', or 'run'…"
            disabled={loading}
            rows={2}
            style={{
              flex: 1, background: "var(--input-bg)",
              border: "1px solid #2a2a2a", borderRadius: "8px",
              color: "#d0d0d0", fontSize: "0.84rem", padding: "9px 12px",
              resize: "none", outline: "none",
              fontFamily: "'IBM Plex Sans', sans-serif",
              lineHeight: 1.55, minHeight: "58px", maxHeight: "120px",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#3a3a3a")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "#2a2a2a")}
          />

          {/* Arrow-up send button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            title="Send (Enter)"
            style={{
              width: "40px", height: "40px", borderRadius: "9px",
              background: text.trim() && !loading ? "#232323" : "#161616",
              border: `1px solid ${text.trim() && !loading ? "#383838" : "#222"}`,
              color: text.trim() && !loading ? "#c0c0c0" : "#3a3a3a",
              cursor: text.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!loading && text.trim()) {
                (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a";
                (e.currentTarget as HTMLButtonElement).style.color = "#e0e0e0";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = text.trim() && !loading ? "#232323" : "#161616";
              (e.currentTarget as HTMLButtonElement).style.color = text.trim() && !loading ? "#c0c0c0" : "#3a3a3a";
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" /><path d="M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}