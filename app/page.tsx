"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import TopBar from "@/components/TopBar";
import ContactsSidebar from "@/components/ContactsSidebar";
import ChatPane from "@/components/ChatPane";
import { useStorage } from "@/lib/useStorage";
import { callBackend, clearBackendHistory, CHIP_PROMPTS } from "@/lib/api";
import type { Contact, ChatMessage } from "@/lib/types";

const WELCOME_CHIPS: ChatMessage["chips"] = [
  { label: "Too many tools",       action: "pain_tools"    },
  { label: "Security concerns",    action: "pain_security" },
  { label: "Slow deployments",     action: "pain_cicd"     },
  { label: "Asking about pricing", action: "pain_pricing"  },
];

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 480;
const SIDEBAR_DEFAULT = 280;

export default function Page() {
  const { contacts, setContacts, histories, setHistories, ready } = useStorage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(SIDEBAR_DEFAULT);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW.current + delta));
      setSidebarWidth(next);
    }
    function onMouseUp() {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.querySelector(".resize-handle")?.classList.remove("dragging");
      }
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function startDrag(e: React.MouseEvent) {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    (e.currentTarget as HTMLDivElement).classList.add("dragging");
  }

  const activeContact: Contact | null = contacts.find((c) => c.id === activeId) ?? null;
  // UI display history — frontend keeps this for rendering only
  const activeMessages: ChatMessage[] = activeId ? (histories[activeId] ?? []) : [];

  const pushMessage = useCallback(
    (role: "user" | "assistant", content: string, chips?: ChatMessage["chips"]) => {
      setHistories((prev) => {
        if (!activeId) return prev;
        const existing = prev[activeId] ?? [];
        return { ...prev, [activeId]: [...existing, { role, content, chips }] };
      });
    },
    [activeId, setHistories]
  );

  function welcomeMessage(name: string): ChatMessage {
    return {
      role: "assistant",
      content: `Hi! I'm your GitLab sales assistant for **${name}**. Tell me about them — what industry are they in, or what brought them to this call?`,
      chips: WELCOME_CHIPS,
    };
  }

  function handleSelect(id: string) {
    setActiveId(id);
    if (!(histories[id] ?? []).length) {
      const c = contacts.find((x) => x.id === id);
      if (!c) return;
      setHistories((prev) => ({ ...prev, [id]: [welcomeMessage(c.name)] }));
    }
  }

  function handleAdd(name: string) {
    const id = Date.now().toString();
    setContacts([{ id, name }, ...contacts]);
    setActiveId(id);
    setHistories((prev) => ({ ...prev, [id]: [welcomeMessage(name)] }));
  }

  async function handleDelete(id: string) {
    setContacts(contacts.filter((c) => c.id !== id));
    setHistories((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeId === id) setActiveId(null);
    // Tell the backend to drop this contact's history too
    await clearBackendHistory(id).catch(() => {});
  }

  async function handleSend(text: string) {
    if (!activeId || !activeContact || loading) return;
    pushMessage("user", text);
    setLoading(true);
    try {
      // No history sent — backend owns that now
      const reply = await callBackend(activeContact.id, activeContact.name, text);
      pushMessage("assistant", reply);
    } catch (e: any) {
      pushMessage("assistant", `⚠️ ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleChip(action: string) {
    const prompt = CHIP_PROMPTS[action];
    if (prompt) await handleSend(prompt);
  }

  if (!ready) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
      <TopBar activeContact={activeContact} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: `${sidebarWidth}px`, flexShrink: 0, height: "100%", overflow: "hidden", borderRight: "1px solid var(--border)" }}>
          <ContactsSidebar
            contacts={contacts}
            histories={histories}
            activeId={activeId}
            onSelect={handleSelect}
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        </div>

        <div className="resize-handle" onMouseDown={startDrag} title="Drag to resize" />

        <ChatPane
          contact={activeContact}
          messages={activeMessages}
          loading={loading}
          onSend={handleSend}
          onChipClick={handleChip}
        />
      </div>
    </div>
  );
}