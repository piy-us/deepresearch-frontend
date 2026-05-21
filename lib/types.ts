export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  chips?: { label: string; action: string }[];
};

export type Contact = {
  id: string;
  name: string;
};

export type Histories = Record<string, ChatMessage[]>;
