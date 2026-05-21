"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { saveReport } from "@/lib/api";

interface Props {
  query: string;
  result: any | null;
  configForSave: any;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const chipCss: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "5px",
  background: "#141414", border: "1px solid #242424",
  color: "#555", fontSize: "0.68rem", fontWeight: 600,
  padding: "4px 11px", borderRadius: "20px",
  fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.03em",
};

const btnCss: React.CSSProperties = {
  background: "#1a1a1a", border: "1px solid #2a2a2a",
  borderRadius: "7px", color: "#aaa",
  fontSize: "0.82rem", fontWeight: 600, padding: "8px 14px",
  cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
  transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: "6px",
};

/* Sidebar toggle icon — panel with arrow */
function SidebarToggleIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Panel outline */}
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      {/* Vertical divider */}
      <line x1="9" y1="3" x2="9" y2="21" />
      {/* Arrow pointing left (close) or right (open) */}
      {open ? (
        <polyline points="13 8 7.5 12 13 16" />
      ) : (
        <polyline points="13 8 18.5 12 13 16" />
      )}
    </svg>
  );
}

export default function ReportPane({ query, result, configForSave, sidebarOpen, onToggleSidebar }: Props) {
  const report = result?.final_report as string | undefined;
  const learnings = result?.learnings?.length ?? 0;
  const sources   = result?.sources?.length ?? 0;
  const chars     = report?.length ?? 0;

  async function onSave() {
    if (!report) return;
    const filename = query ? `report_${query.slice(0, 30).replaceAll(" ", "_")}.md` : "report.md";
    await saveReport(report, filename, configForSave);
    alert(`Saved as ${filename}`);
  }

  function onDownload() {
    if (!report) return;
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = query ? `report_${query.slice(0, 30).replaceAll(" ", "_")}.md` : "report.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100%", padding: "20px 24px 40px", fontFamily: "'IBM Plex Sans', sans-serif" }}>

      {/* ── App bar ── */}
      <div style={{
        background: "#111", border: "1px solid #1e1e1e",
        borderRadius: "9px", padding: "10px 16px",
        display: "flex", alignItems: "center", gap: "10px",
        marginBottom: "22px",
      }}>
        {/* macOS dots */}
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57", display: "inline-block", flexShrink: 0 }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffbd2e", display: "inline-block", flexShrink: 0 }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#28ca41", display: "inline-block", flexShrink: 0 }} />

        {/* Sidebar toggle — lives in app-bar, never overlaps title */}
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide chat panel" : "Show chat panel"}
          style={{
            marginLeft: "6px",
            width: "28px", height: "28px",
            borderRadius: "6px",
            background: "transparent",
            border: "1px solid transparent",
            color: "#444",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a";
            (e.currentTarget as HTMLButtonElement).style.color = "#888";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "#444";
          }}
        >
          <SidebarToggleIcon open={sidebarOpen} />
        </button>

        {/* Title */}
        <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#c8c8c8", letterSpacing: "0.01em" }}>
          🔬 Deep Research Agent
        </span>
      </div>

      {/* ── Section label ── */}
      <div style={{
        fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em",
        color: "#2e2e2e", fontFamily: "'IBM Plex Mono', monospace",
        paddingBottom: "10px", borderBottom: "1px solid #1a1a1a",
        marginBottom: "16px", textTransform: "uppercase",
      }}>
        {report ? "Research Results" : "Waiting for task…"}
      </div>

      {!report ? (
        <div style={{ paddingTop: "80px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", opacity: 0.18, marginBottom: "16px" }}>🔬</div>
          <h3 style={{ color: "#2e2e2e", fontSize: "0.87rem", fontWeight: 500, margin: "0 0 12px" }}>
            Your research report will appear here
          </h3>
          <p style={{ fontSize: "0.76rem", lineHeight: 2.1, color: "#282828", margin: 0 }}>
            1. Enter your API Keys in the config panel.<br />
            2. Type your research topic in the chat.<br />
            3. Choose follow-ups or run immediately.<br />
            4. Read the full report here.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
            <span style={chipCss}>📚 {learnings} learnings</span>
            <span style={chipCss}>🔗 {sources} sources</span>
            <span style={chipCss}>📝 {chars.toLocaleString()} chars</span>
          </div>

          <div className="report-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          </div>

          <div style={{ borderTop: "1px solid #1a1a1a", margin: "28px 0 20px" }} />

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={onDownload} style={btnCss}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#222"; (e.currentTarget as HTMLButtonElement).style.color = "#ccc"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1a1a1a"; (e.currentTarget as HTMLButtonElement).style.color = "#aaa"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Markdown
            </button>
            <button
              onClick={onSave} style={{ ...btnCss, background: "#1e1e1e", border: "1px solid #333", color: "#bbb" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#252525"; (e.currentTarget as HTMLButtonElement).style.color = "#ddd"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1e1e1e"; (e.currentTarget as HTMLButtonElement).style.color = "#bbb"; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              Save to server
            </button>
          </div>
        </>
      )}
    </div>
  );
}