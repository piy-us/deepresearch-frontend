"use client";

import type { Contact } from "@/lib/types";

interface Props {
  activeContact: Contact | null;
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

export default function TopBar({ activeContact }: Props) {
  return (
    <div
      style={{
        height: "52px",
        flexShrink: 0,
        background: "#ffffff",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "14px",
        zIndex: 10,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <svg width="22" height="22" viewBox="0 0 380 380" fill="none">
          <path d="M190 340L290 120L340 240L190 340Z" fill="#fc6d26"/>
          <path d="M190 340L90 120L40 240L190 340Z" fill="#e24329"/>
          <path d="M190 340L90 120H290L190 340Z" fill="#fca326"/>
        </svg>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "#1a1a1a",
          }}
        >
          GitLab Sales
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.6rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "#fff",
            background: "var(--accent)",
            borderRadius: "3px",
            padding: "1px 6px",
            textTransform: "uppercase",
          }}
        >
          AI
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: "1px", height: "22px", background: "var(--border)", flexShrink: 0 }} />

      {/* Active client */}
      <div style={{ display: "flex", alignItems: "center", gap: "9px", flex: 1, minWidth: 0 }}>
        {activeContact ? (
          <>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace",
                background: "var(--accent-dim)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent)",
              }}
            >
              {initials(activeContact.name)}
            </div>
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--text-bright)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {activeContact.name}
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.58rem",
                fontWeight: 500,
                letterSpacing: "0.08em",
                color: "var(--text-dim)",
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              · Active session
            </span>
          </>
        ) : (
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
            Select a client to begin
          </span>
        )}
      </div>

      {/* Backend status indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.65rem",
          color: "var(--text-dim)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#4caf50",
            boxShadow: "0 0 0 2px rgba(76,175,80,0.2)",
          }}
        />
        API connected
      </div>
    </div>
  );
}