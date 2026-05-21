"use client";

import { useState, useEffect } from "react";
import type { Contact, Histories } from "./types";

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useStorage() {
  const [contacts, setContactsState] = useState<Contact[]>([]);
  const [histories, setHistoriesState] = useState<Histories>({});
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    setContactsState(readJSON<Contact[]>("gl_contacts", []));
    setHistoriesState(readJSON<Histories>("gl_histories", {}));
    setReady(true);
  }, []);

  function setContacts(next: Contact[]) {
    setContactsState(next);
    localStorage.setItem("gl_contacts", JSON.stringify(next));
  }

  function setHistories(next: Histories) {
    setHistoriesState(next);
    localStorage.setItem("gl_histories", JSON.stringify(next));
  }

  return { contacts, setContacts, histories, setHistories, ready };
}
