"use client";

import { useMemo, useState } from "react";
import ChatSidebar, { ChatMessage, ConfigState } from "@/components/ChatSidebar";
import ReportPane from "@/components/ReportPane";
import ResizableShell from "@/components/ResizableShell";
import { generateFollowups, runResearch } from "@/lib/api";

type Phase = "need_query" | "need_action" | "asking_followups" | "completed";

export default function Page() {
  const [phase, setPhase] = useState<Phase>("need_query");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! What topic would you like to research today?" },
  ]);

  const [cfg, setCfg] = useState<ConfigState>({
    llm_provider: "gemini",
    breadth: 4,
    depth: 2,
    llm_api_key: "",
    firecrawl_api_key: "",
  });

  const [query, setQuery] = useState("");
  const [followups, setFollowups] = useState<string[]>([]);
  const [followupAnswers, setFollowupAnswers] = useState<string[]>([]);
  const [answersCollected, setAnswersCollected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const agentConfig = useMemo(() => ({
    breadth: cfg.breadth,
    depth: cfg.depth,
    llm_provider: cfg.llm_provider,
    llm_api_key: cfg.llm_api_key || undefined,
    firecrawl_api_key: cfg.firecrawl_api_key || undefined,
  }), [cfg]);

  function push(role: "user" | "assistant", content: string, chips?: ChatMessage["chips"]) {
    setMessages((m) => [...m, { role, content, chips }]);
  }

  function validateKeys(): boolean {
    if (!cfg.llm_api_key || !cfg.firecrawl_api_key) {
      push("assistant", "⚠️ **Missing API Keys!** Please open *Configuration & API Keys* in the panel and enter your keys.");
      return false;
    }
    return true;
  }

  async function handleGenerate() {
    if (!query) { push("assistant", "Please enter a research topic first."); return; }
    if (!validateKeys()) return;
    setLoading(true);
    try {
      const { questions } = await generateFollowups(query, agentConfig);
      const qs = (questions || []).slice(0, 3);
      setFollowups(qs);
      setFollowupAnswers([]);
      setAnswersCollected(0);
      if (qs.length) {
        setPhase("asking_followups");
        push("assistant", `I have ${qs.length} follow-up question${qs.length > 1 ? "s" : ""}. Here's the first:\n\n**1.** ${qs[0]}`);
      } else {
        await handleRun(true);
      }
    } catch (e: any) {
      push("assistant", `⚠️ Error generating follow-ups:\n\n${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleRun(skipValidation = false) {
    if (!query) { push("assistant", "Please enter a research topic first."); return; }
    if (!skipValidation && !validateKeys()) return;
    setLoading(true);
    try {
      push("assistant", "Running deep research… this may take a few minutes. ☕");
      const res = await runResearch(query, followupAnswers, agentConfig);
      setResult(res.result);
      setPhase("completed");
      push("assistant", "✅ Research complete! The full report is on the right →");
    } catch (e: any) {
      push("assistant", `⚠️ Error running research:\n\n${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function onUserSend(text: string) {
    const t = text.trim();
    if (!t) return;
    push("user", t);

    if (phase === "need_query") {
      setQuery(t);
      setPhase("need_action");
      push("assistant", "Got it! How would you like to proceed?", [
        { label: "✦ Generate follow-ups", action: "generate" },
        { label: "▶ Run research now",    action: "run"      },
      ]);
      return;
    }

    if (phase === "need_action") {
      const lower = t.toLowerCase();
      if (["generate", "followups", "follow-ups"].includes(lower)) { await handleGenerate(); }
      else if (["run", "start", "research"].includes(lower))       { await handleRun(); }
      else {
        push("assistant", "Please type **generate** or **run**, or tap one of the buttons above.", [
          { label: "✦ Generate follow-ups", action: "generate" },
          { label: "▶ Run research now",    action: "run"      },
        ]);
      }
      return;
    }

    if (phase === "asking_followups") {
      if (["run", "start", "research"].includes(t.toLowerCase())) { await handleRun(); return; }
      const currentQ = followups[answersCollected];
      setFollowupAnswers((a) => [...a, `${currentQ}\nAnswer: ${t}`]);
      const next = answersCollected + 1;
      setAnswersCollected(next);
      if (next < followups.length) {
        push("assistant", `**${next + 1}.** ${followups[next]}`);
      } else {
        push("assistant", "Thanks! Starting research with your answers…");
        await handleRun(true);
      }
      return;
    }

    if (phase === "completed") {
      push("assistant", "Research is already complete. Refresh the page to start a new query.");
    }
  }

  async function onChipClick(action: string) {
    if (action === "generate") await handleGenerate();
    else if (action === "run")  await handleRun();
  }

  return (
    <ResizableShell
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((o) => !o)}
      defaultLeftWidth={380}
      minLeft={260}
      maxLeft={580}
      left={
        <ChatSidebar
          messages={messages}
          onSend={onUserSend}
          onChipClick={onChipClick}
          loading={loading}
          config={cfg}
          onConfigChange={setCfg}
        />
      }
      right={
        <ReportPane
          query={query}
          result={result}
          configForSave={agentConfig}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />
      }
    />
  );
}