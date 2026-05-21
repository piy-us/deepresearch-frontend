"use client";

import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage, Contact } from "@/lib/types";

interface Props {
  contact: Contact | null;
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  onChipClick: (action: string) => void;
}

function LoadingDots() {
  return (
    <div style={{ display: "inline-flex", gap: "5px", alignItems: "center", padding: "3px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--text-dim)",
            display: "inline-block",
            animation: `dotPulse 1.4s ease-in-out ${i * 0.22}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Avatar({ role, name }: { role: "user" | "assistant"; name?: string }) {
  if (role === "assistant") {
    return (
      <div style={{
        width: "30px", height: "30px",
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #1e2a4a 0%, #2a3a6a 100%)",
        border: "1.5px solid var(--accent-border)",
        fontSize: "0.75rem",
      }}>
        🤖
      </div>
    );
  }
  // User avatar with initials
  const init = name
    ? name.trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "ME";
  return (
    <div style={{
      width: "30px", height: "30px",
      borderRadius: "50%",
      flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--msg-user)",
      border: "1.5px solid var(--msg-user-border)",
      fontSize: "0.58rem",
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#a5b8ff",
    }}>
      {init}
    </div>
  );
}

export default function ChatPane({ contact, messages, loading, onSend, onChipClick }: Props) {
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSubmit() {
    const t = text.trim();
    if (!t || loading || !contact) return;
    setText("");
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend(t);
  }

  // Auto-resize textarea
  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  const canSend = !!text.trim() && !loading && !!contact;

  // Chips: only from the LAST assistant message that has chips
  const activeChips = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant" && messages[i].chips && messages[i].chips!.length > 0) {
        return messages[i].chips!;
      }
    }
    return [];
  })();

  if (!contact) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        background: "var(--bg)",
      }}>
        <div style={{
          width: "64px", height: "64px",
          borderRadius: "16px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.8rem",
          opacity: 0.4,
        }}>
          💬
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "var(--text-bright)",
            margin: "0 0 6px",
            opacity: 0.5,
          }}>
            No client selected
          </p>
          <p style={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            margin: 0,
            lineHeight: 1.6,
          }}>
            Choose a client from the sidebar to begin your sales session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      minHeight: 0,
      background: "var(--bg)",
    }}>
      {/* Messages — scrollable */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 16px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <div style={{ width: "100%", maxWidth: "720px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                flexDirection: m.role === "user" ? "row-reverse" : "row",
                animation: "fadeUp 0.2s ease-out",
              }}
            >
              <Avatar role={m.role} name={contact.name} />
              <div style={{
                maxWidth: "76%",
                background: m.role === "assistant" ? "var(--msg-ai)" : "var(--msg-user)",
                border: `1px solid ${m.role === "assistant" ? "var(--msg-ai-border)" : "var(--msg-user-border)"}`,
                borderRadius: m.role === "assistant" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                padding: "11px 15px",
                boxShadow: m.role === "assistant"
                  ? "0 2px 8px rgba(0,0,0,0.15)"
                  : "0 2px 8px rgba(99,132,255,0.1)",
              }}>
                <div className={m.role === "user" ? "chat-prose chat-prose-user" : "chat-prose"}>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <Avatar role="assistant" />
              <div style={{
                background: "var(--msg-ai)",
                border: "1px solid var(--msg-ai-border)",
                borderRadius: "4px 14px 14px 14px",
                padding: "12px 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}>
                <LoadingDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div style={{
        borderTop: "1px solid var(--border)",
        padding: "12px 16px 16px",
        flexShrink: 0,
        background: "var(--panel)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}>
        {/* Quick-action chips — only above input, never in message history */}
        {activeChips.length > 0 && (
          <div style={{
            width: "100%",
            maxWidth: "720px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
          }}>
            {activeChips.map((chip) => (
              <button
                key={chip.action}
                onClick={() => onChipClick(chip.action)}
                disabled={loading}
                className="action-chip"
                style={{
                  padding: "5px 13px",
                  background: "var(--panel-elevated)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "20px",
                  color: "var(--text-dim)",
                  fontSize: "0.71rem",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.02em",
                  opacity: loading ? 0.4 : 1,
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Text input row */}
        <div style={{ width: "100%", maxWidth: "720px", display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <div style={{
            flex: 1,
            background: "var(--input-bg)",
            border: "1px solid var(--input-border)",
            borderRadius: "12px",
            position: "relative",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
            onFocusCapture={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-focus)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px var(--accent-glow)";
            }}
            onBlurCapture={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--input-border)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={`Message about ${contact.name}… (Shift+Enter for newline)`}
              disabled={loading || !contact}
              rows={1}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderRadius: "12px",
                color: "var(--text-bright)",
                fontSize: "0.855rem",
                padding: "11px 14px",
                resize: "none",
                outline: "none",
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.6,
                minHeight: "44px",
                maxHeight: "120px",
                caretColor: "var(--accent)",
                display: "block",
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSend}
            title="Send (Enter)"
            className="send-btn"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: canSend
                ? "linear-gradient(135deg, var(--accent) 0%, #7c9aff 100%)"
                : "var(--panel-elevated)",
              border: `1px solid ${canSend ? "transparent" : "var(--border)"}`,
              color: canSend ? "#fff" : "var(--text-muted)",
              cursor: canSend ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s",
              boxShadow: canSend ? "0 2px 12px rgba(99,132,255,0.3)" : "none",
            }}
            onMouseEnter={(e) => {
              if (canSend) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,132,255,0.45)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = canSend ? "0 2px 12px rgba(99,132,255,0.3)" : "none";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Hint */}
        <div style={{
          width: "100%",
          maxWidth: "720px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Enter ↵ to send · Shift+Enter for newline
          </span>
          {text.length > 0 && (
            <span style={{
              fontSize: "0.62rem",
              color: text.length > 400 ? "#f87171" : "var(--text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {text.length}/500
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}