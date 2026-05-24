"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, FilePlus2, Send, ShieldAlert, UploadCloud } from "lucide-react";
import { AgentActionCards, type AgentAction } from "@/components/agent/AgentActionCards";
import { AgentMessage } from "@/components/agent/AgentMessage";
import { AgentSuggestions } from "@/components/agent/AgentSuggestions";

type Message = { role: "admin" | "agent"; content: string };

const mainActions: AgentAction[] = [
  {
    id: "upload",
    title: "Cargar factura",
    detail: "Sube el documento del taller y empieza la auditoria.",
    href: "/upload",
    icon: "upload",
  },
  {
    id: "claims",
    title: "Registrar siniestro",
    detail: "Carga el caso reportado por el cliente para validar la factura.",
    href: "/claims",
    icon: "claims",
  },
  {
    id: "generator",
    title: "Crear ejemplo",
    detail: "Genera una factura de prueba para conocer el flujo.",
    href: "/generator",
    icon: "generator",
  },
];

const secondaryActions: AgentAction[] = [
  {
    id: "rules",
    title: "Que valida",
    detail: "Reglas de factura, siniestro, taller, tarifario e impuestos.",
    prompt: "Que valida el motor de auditoria y que datos necesito cargar?",
    icon: "audit",
  },
  {
    id: "flow",
    title: "Ver flujo",
    detail: "Pasos recomendados para auditar un caso completo.",
    prompt: "Explicame el flujo de auditoria con literales y un ejemplo corto.",
    icon: "help",
  },
];

export function HomeAgentConsole() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState(["Explica el flujo", "Que debo cargar primero", "Que valida el motor"]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content:
        "Bienvenido. Para empezar puedes cargar una factura, registrar un siniestro o crear una factura de ejemplo. Si no sabes que elegir, preguntame y te guio paso a paso.",
    },
  ]);
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "home-session";
    const key = "audit-agent-home-session";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = `home_${Date.now().toString(36)}`;
    window.localStorage.setItem(key, next);
    return next;
  }, []);

  async function send(value = input) {
    if (!value.trim()) return;
    setBusy(true);
    setInput("");
    setMessages((current) => [...current, { role: "admin", content: value }]);
    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value, sessionId, pageContext: "dashboard" }),
      });
      const data = await response.json();
      setMessages((current) => [...current, { role: "agent", content: data.reply || "No pude construir una respuesta." }]);
      setSuggestions(data.suggestions || []);
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  return (
    <section className="rounded border border-line bg-white shadow-subtle">
      <div className="border-b border-line p-5">
        <div className="mb-4 flex items-center justify-center gap-2 text-navy">
          <Bot className="size-5" />
          <h2 className="font-semibold">Que quieres hacer ahora?</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <QuickAction icon={<UploadCloud className="size-5" />} action={mainActions[0]} />
          <QuickAction icon={<ShieldAlert className="size-5" />} action={mainActions[1]} />
          <QuickAction icon={<FilePlus2 className="size-5" />} action={mainActions[2]} />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 p-5">
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <AgentMessage key={index} {...message} />
            ))}
            {busy && <AgentMessage role="agent" content="Revisando la informacion disponible..." />}
          </div>
          <div className="mt-4">
            <AgentSuggestions suggestions={suggestions} onPick={(value) => void send(value)} />
            <form className="mt-3 flex gap-2" onSubmit={submit}>
              <input
                className="min-w-0 flex-1 rounded border border-line px-3 py-2 text-sm focus-ring"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ej: quiero auditar una factura PDF"
              />
              <button className="grid size-10 place-items-center rounded bg-navy text-white disabled:opacity-50" disabled={busy} aria-label="Enviar">
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-line bg-surface p-4 lg:border-l lg:border-t-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-steel">Ayuda rapida</p>
          <AgentActionCards actions={secondaryActions} compact onAsk={(value) => void send(value)} />
        </div>
      </div>
    </section>
  );
}

function QuickAction({ icon, action }: { icon: React.ReactNode; action: AgentAction }) {
  return (
    <a className="focus-ring group rounded border border-line bg-white p-4 text-left transition hover:border-navy/50 hover:bg-surface" href={action.href}>
      <span className="mb-3 grid size-10 place-items-center rounded bg-navy text-white">{icon}</span>
      <span className="block font-semibold text-ink">{action.title}</span>
      <span className="mt-1 block text-sm leading-5 text-steel">{action.detail}</span>
    </a>
  );
}
