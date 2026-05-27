"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Plus, Send } from "lucide-react";
import { AgentMessage } from "@/components/agent/AgentMessage";
import { AgentSuggestions } from "@/components/agent/AgentSuggestions";
import { chatTitleFrom, createChat, loadChatHistory, saveChatHistory, type StoredChat, type StoredChatMessage } from "@/lib/agent/chat-history";

type AgentChatPanelProps = {
  pageContext?: "dashboard" | "case_detail" | "tariffs" | "cases" | "claims" | "clients" | "workshops" | "generator" | "upload";
  currentInvoiceNumber?: string;
};

const quickSuggestions = ["Explicame el flujo", "Resume el dashboard", "Que valida el motor?", "Buscar alertas criticas"];

const initialMessages: StoredChatMessage[] = [
  {
    role: "agent",
    content: "Hola. Soy el asistente local del Auditor Agentico de Facturacion de Siniestros. Puedo ayudarte con flujo, facturas, siniestros, tarifario, alertas, talleres, OCR y casos observed/rejected.",
    suggestions: quickSuggestions,
  },
];

export function AgentChatPanel({ pageContext = "dashboard", currentInvoiceNumber }: AgentChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<StoredChatMessage[]>(initialMessages);
  const [chats, setChats] = useState<StoredChat[]>([]);
  const [activeChatId, setActiveChatId] = useState("");

  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "agent-session";
    const key = "ollama-agent-session-id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = `agent_${Date.now().toString(36)}`;
    window.localStorage.setItem(key, next);
    return next;
  }, []);

  useEffect(() => {
    const stored = loadChatHistory();
    const first = stored[0];
    if (first) {
      setChats(stored);
      setActiveChatId(first.id);
      setMessages(first.messages);
      return;
    }
    const chat = createChat(initialMessages, "Agente local");
    setChats([chat]);
    setActiveChatId(chat.id);
    saveChatHistory([chat]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  function persist(nextMessages: StoredChatMessage[], titleSeed?: string) {
    setChats((current) => {
      const id = activeChatId || `chat_${Date.now().toString(36)}`;
      const currentTitle = current.find((chat) => chat.id === id)?.title;
      const updated: StoredChat = {
        id,
        title: titleSeed ? chatTitleFrom(titleSeed) : currentTitle || "Agente local",
        updatedAt: new Date().toISOString(),
        messages: nextMessages,
      };
      const next = [updated, ...current.filter((chat) => chat.id !== id)].slice(0, 12);
      saveChatHistory(next);
      if (!activeChatId) setActiveChatId(id);
      return next;
    });
  }

  async function send(value = input) {
    const clean = value.trim();
    if (!clean || busy) return;

    const userMessage: StoredChatMessage = { role: "admin", content: clean };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    persist(nextMessages, clean);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, sessionId, pageContext, currentInvoiceNumber }),
      });
      const data = await response.json();
      const agentMessage: StoredChatMessage = {
        role: "agent",
        content: data.reply || "No pude construir una respuesta con el modelo local.",
        suggestions: data.suggestions?.length ? data.suggestions : quickSuggestions,
      };
      setMessages((current) => {
        const next = [...current, agentMessage];
        persist(next);
        return next;
      });
    } catch {
      const agentMessage: StoredChatMessage = {
        role: "agent",
        content: "No pude conectar con el endpoint local del agente. Revisa que Next.js este corriendo y que Ollama este disponible.",
        suggestions: ["ollama run gemma2:2b", "Resume el dashboard"],
      };
      setMessages((current) => {
        const next = [...current, agentMessage];
        persist(next);
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  function newChat() {
    const chat = createChat(initialMessages, "Agente local");
    const next = [chat, ...chats].slice(0, 12);
    setChats(next);
    setActiveChatId(chat.id);
    setMessages(chat.messages);
    saveChatHistory(next);
  }

  function openChat(chat: StoredChat) {
    setActiveChatId(chat.id);
    setMessages(chat.messages);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  const lastAgentMessage = [...messages].reverse().find((message) => message.role === "agent");
  const activeSuggestions = lastAgentMessage?.suggestions?.length ? lastAgentMessage.suggestions : quickSuggestions;

  return (
    <section className="overflow-hidden rounded border border-line bg-white shadow-subtle">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded bg-navy text-white">
            <Bot className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold text-ink">Agente conversacional local</h2>
            <p className="text-xs font-medium text-steel">Modelo local: gemma2:2b</p>
          </div>
        </div>
        <button className="focus-ring inline-flex items-center gap-2 rounded border border-line px-3 py-2 text-sm font-semibold text-navy hover:bg-surface" type="button" onClick={newChat}>
          <Plus className="size-4" />
          Nuevo chat
        </button>
      </header>

      <div className="grid min-h-[520px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-line bg-surface p-3 lg:border-b-0 lg:border-r">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-steel">Historial</p>
          <div className="space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.id}
                className={activeChatId === chat.id ? "w-full rounded border border-navy bg-white p-2 text-left text-sm text-ink" : "w-full rounded border border-line bg-white p-2 text-left text-sm text-steel hover:text-ink"}
                type="button"
                onClick={() => openChat(chat)}
              >
                <span className="block truncate font-medium">{chat.title}</span>
                <span className="mt-1 block text-xs text-steel">{new Date(chat.updatedAt).toLocaleDateString("es-AR")}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {messages.map((message, index) => (
              <AgentMessage key={`${message.role}-${index}`} role={message.role} content={message.content} />
            ))}
            {busy && <AgentMessage role="agent" content="Preparando respuesta..." />}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-line p-4">
            <AgentSuggestions suggestions={activeSuggestions} onPick={(value) => void send(value)} />
            <form className="mt-3 flex gap-2" onSubmit={submit}>
              <input
                className="min-w-0 flex-1 rounded border border-line px-3 py-2 text-sm focus-ring"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Pregunta sobre facturas, siniestros, OCR, alertas o reglas"
                disabled={busy}
              />
              <button className="grid size-10 place-items-center rounded bg-navy text-white disabled:opacity-50" disabled={busy || !input.trim()} aria-label="Enviar">
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
