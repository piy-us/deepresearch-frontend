"use client";

import { useRef, useState, useEffect, useCallback, ReactNode } from "react";

interface Props {
  left: ReactNode;
  right: ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  defaultLeftWidth?: number;
  minLeft?: number;
  maxLeft?: number;
}

/* ── Icons ─────────────────────────────────── */
export function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
export function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function ResizableShell({
  left,
  right,
  sidebarOpen,
  onToggleSidebar,
  defaultLeftWidth = 380,
  minLeft = 260,
  maxLeft = 600,
}: Props) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setLeftWidth(Math.max(minLeft, Math.min(maxLeft, e.clientX - rect.left)));
    },
    [isDragging, minLeft, maxLeft]
  );
  const onMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp]);

  /* ══════════════════════════════════════════
     MOBILE — report fullscreen + bottom drawer
  ══════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{ width: "100%", height: "100dvh", position: "relative", overflow: "hidden", background: "var(--bg)" }}>
        {/* Report always fills screen */}
        <div style={{ width: "100%", height: "100%", overflowY: "auto" }}>{right}</div>

        {/* Backdrop */}
        <div
          onClick={onToggleSidebar}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            opacity: sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? "auto" : "none",
            transition: "opacity 0.28s ease",
          }}
        />

        {/* Slide-up drawer */}
        <div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            height: "90dvh", zIndex: 50,
            background: "var(--panel)",
            borderTop: "1px solid #2a2a2a",
            borderRadius: "18px 18px 0 0",
            boxShadow: "0 -12px 48px rgba(0,0,0,0.65)",
            transform: sidebarOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.32s cubic-bezier(0.32,0.72,0,1)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          {/* Drawer top bar */}
          <div style={{
            flexShrink: 0, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "10px 16px 6px", position: "relative",
          }}>
            <div style={{ width: "38px", height: "4px", borderRadius: "2px", background: "#2a2a2a" }} />
            <button
              onClick={onToggleSidebar}
              title="Close chat"
              style={{
                position: "absolute", right: "14px",
                width: "32px", height: "32px", borderRadius: "50%",
                background: "#1a1a1a", border: "1px solid #2a2a2a",
                color: "#777", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer",
              }}
            >
              <IconClose />
            </button>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>{left}</div>
        </div>

        {/* FAB — only visible when drawer is CLOSED so it never overlaps send button */}
        <button
          onClick={onToggleSidebar}
          title="Open chat"
          style={{
            position: "fixed", bottom: "22px", right: "18px", zIndex: 60,
            width: "52px", height: "52px", borderRadius: "50%",
            background: "#1e1e1e",
            border: "1px solid #2e2e2e",
            color: "#999",
            display: sidebarOpen ? "none" : "flex",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(0,0,0,0.7)",
            transition: "all 0.2s ease",
          }}
        >
          <IconChat />
        </button>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DESKTOP — resizable side-by-side
  ══════════════════════════════════════════ */
  return (
    <div
      ref={containerRef}
      style={{
        display: "flex", height: "100dvh", overflow: "hidden",
        userSelect: isDragging ? "none" : "auto",
        cursor: isDragging ? "col-resize" : "auto",
      }}
    >
      {/* Left */}
      <div style={{
        width: sidebarOpen ? leftWidth : 0,
        flexShrink: 0, overflow: "hidden",
        transition: isDragging ? "none" : "width 0.26s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{ width: leftWidth, height: "100%", display: "flex", flexDirection: "column" }}>
          {left}
        </div>
      </div>

      {/* Drag handle */}
      {sidebarOpen && (
        <div
          onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
          style={{ width: "5px", flexShrink: 0, cursor: "col-resize", position: "relative", zIndex: 10 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#1e1e1e")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
        >
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: "3px", height: "44px", borderRadius: "4px",
            background: isDragging ? "#3a3a3a" : "#1e1e1e",
          }} />
        </div>
      )}

      {/* Right */}
      <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>{right}</div>
    </div>
  );
}