export type StoredChatMessage = {
  role: "admin" | "agent";
  content: string;
  suggestions?: string[];
};

export type StoredChat = {
  id: string;
  title: string;
  updatedAt: string;
  messages: StoredChatMessage[];
};

const STORAGE_KEY = "audit-agent-chat-history";

export function loadChatHistory(): StoredChat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredChat[]) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(chats: StoredChat[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 20)));
}

export function chatTitleFrom(content: string) {
  const clean = content.replace(/\s+/g, " ").trim();
  if (!clean) return "Nueva conversación";
  return clean.length > 46 ? `${clean.slice(0, 46)}...` : clean;
}

export function createChat(messages: StoredChatMessage[], title = "Nueva conversación"): StoredChat {
  return {
    id: `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    updatedAt: new Date().toISOString(),
    messages,
  };
}
