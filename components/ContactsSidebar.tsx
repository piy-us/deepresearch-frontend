"use client";

import { useState } from "react";
import type { Contact, ChatMessage, Histories } from "@/lib/types";

interface Props {
  contacts: Contact[];
  histories: Histories;
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function lastMessage(hist: ChatMessage[] | undefined): string {
  if (!hist || hist.length === 0) return "No messages yet";
  const last = hist[hist.length - 1].content;
  return last.length > 40 ? last.slice(0, 40) + "…" : last;
}

export default function ContactsSidebar({
  contacts,
  histories,
  activeId,
  onSelect,
  onAdd,
  onDelete,
}: Props) {
  const [newName, setNewName] = useState("");

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    onAdd(name);
    setNewName("");
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--panel)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 12px 12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.58rem",
            fontWeight: 600,
            letterSpacing: "0.16em",
            color: "var(--text-dim)",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Clients
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <input
            style={{
              flex: 1,
              background: "var(--input-bg)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              color: "var(--text-bright)",
              fontSize: "0.8rem",
              padding: "6px 9px",
              outline: "none",
              fontFamily: "'IBM Plex Sans', sans-serif",
              transition: "border-color 0.15s",
            }}
            type="text"
            placeholder="Add client name…"
            maxLength={50}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          <button
            onClick={handleAdd}
            title="Add client"
            style={{
              width: "30px",
              height: "30px",
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-border)",
              borderRadius: "6px",
              color: "var(--accent)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "18px",
              lineHeight: 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-dim)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
        {contacts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 16px",
              fontSize: "0.75rem",
              color: "var(--text-dim)",
              lineHeight: 2,
            }}
          >
            No clients yet.
            <br />
            Type a name above
            <br />
            and press Enter.
          </div>
        ) : (
          contacts.map((c) => {
            const isActive = c.id === activeId;
            return (
              <div
                key={c.id}
                onClick={() => onSelect(c.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  padding: "8px 8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  marginBottom: "2px",
                  transition: "background 0.12s",
                  border: `1px solid ${isActive ? "var(--accent-border)" : "transparent"}`,
                  background: isActive ? "var(--accent-dim)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLDivElement).style.background = "#fafaf8";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: isActive ? "var(--accent-dim)" : "#f5f4f1",
                    border: `1px solid ${isActive ? "var(--accent-border)" : "var(--border)"}`,
                    color: isActive ? "var(--accent)" : "var(--text-dim)",
                  }}
                >
                  {initials(c.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.83rem",
                      fontWeight: 500,
                      color: isActive ? "var(--accent)" : "var(--text-bright)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text-dim)",
                      marginTop: "1px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {lastMessage(histories[c.id])}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  title="Remove client"
                  style={{
                    width: "20px",
                    height: "20px",
                    background: "none",
                    border: "none",
                    color: "var(--text-dim)",
                    cursor: "pointer",
                    fontSize: "16px",
                    opacity: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    flexShrink: 0,
                    transition: "opacity 0.15s",
                  }}
                  className="contact-del"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        div:hover > .contact-del { opacity: 1 !important; }
        .contact-del:hover { background: #fee8e0 !important; color: var(--accent) !important; }
      `}</style>
    </div>
  );
}