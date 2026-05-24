"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { AgentActionCards, type AgentAction } from "./AgentActionCards";
import { AgentInsightCard } from "./AgentInsightCard";
import { AgentMessage } from "./AgentMessage";
import { AgentSuggestions } from "./AgentSuggestions";
import type { AgentInsight, AgentIntent } from "@/lib/agent/agent-types";

type Message = { role: "admin" | "agent"; content: string };

const chatActions: AgentAction[] = [
  { id: "upload", title: "Cargar factura", detail: "Ir al OCR y auditoria.", href: "/upload", icon: "upload" },
  { id: "claims", title: "Siniestro", detail: "Registrar o revisar datos.", href: "/claims", icon: "claims" },
  { id: "flow", title: "Explicar flujo", detail: "Ver pasos recomendados.", prompt: "Explicame el flujo de auditoria con literales y un ejemplo corto.", icon: "help" },
];

function pageContext(pathname: string) {
  if (pathname === "/dashboard" || pathname === "/") return "dashboard";
  if (pathname.startsWith("/cases/")) return "case_detail";
  if (pathname === "/cases") return "cases";
  if (pathname === "/tariffs") return "tariffs";
  if (pathname === "/claims") return "claims";
  if (pathname === "/clients") return "clients";
  if (pathname === "/workshops") return "workshops";
  if (pathname === "/generator") return "generator";
  if (pathname === "/upload") return "upload";
  return "dashboard";
}

function currentCaseId(pathname: string) {
  const match = pathname.match(/^\/cases\/([^/]+)/);
  return match?.[1];
}

export function AgentChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content:
        "Hola. Soy tu asistente de auditoria. Puedo guiarte para cargar facturas, revisar siniestros, comparar tarifarios y priorizar casos.",
    },
  ]);
  const [suggestions, setSuggestions] = useState(["Que debo revisar primero", "Ver casos criticos", "Analizar talleres"]);
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [intent, setIntent] = useState<AgentIntent | "">("");
  const [busy, setBusy] = useState(false);
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "admin-session";
    const key = "audit-agent-session";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = `session_${Date.now().toString(36)}`;
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
        body: JSON.stringify({
          message: value,
          sessionId,
          currentCaseId: currentCaseId(pathname),
          pageContext: pageContext(pathname),
        }),
      });
      const data = await response.json();
      setMessages((current) => [...current, { role: "agent", content: data.reply || "No pude construir una respuesta." }]);
      setSuggestions(data.suggestions || []);
      setInsights(data.insights || []);
      setIntent(data.intent || "");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-line bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded bg-navy text-white">
            <Bot className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-ink">Asistente de auditoria</p>
            {intent && <p className="text-xs text-steel">{intentLabel(intent)}</p>}
          </div>
        </div>
        <button className="grid size-9 place-items-center rounded border border-line" onClick={onClose} aria-label="Cerrar asistente">
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <AgentMessage key={index} {...message} />
        ))}
        <div className="rounded border border-line bg-surface p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-steel">Acciones rapidas</p>
          <AgentActionCards actions={chatActions} compact onAsk={(value) => void send(value)} />
        </div>
        {busy && <AgentMessage role="agent" content="Analizando datos registrados..." />}
        {!!insights.length && (
          <div className="grid grid-cols-2 gap-2">
            {insights.map((insight, index) => (
              <AgentInsightCard key={index} insight={insight} />
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-line p-4">
        <AgentSuggestions suggestions={suggestions} onPick={(value) => void send(value)} />
        <form className="mt-3 flex gap-2" onSubmit={submit}>
          <input
            className="min-w-0 flex-1 rounded border border-line px-3 py-2 text-sm focus-ring"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Pregunta por facturas, alertas, siniestros..."
          />
          <button className="grid size-10 place-items-center rounded bg-navy text-white disabled:opacity-50" disabled={busy} aria-label="Enviar">
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function intentLabel(intent: AgentIntent) {
  const labels: Record<AgentIntent, string> = {
    resumen_caso: "Resumen de caso",
    explicar_alerta: "Analisis de alertas",
    buscar_factura: "Busqueda de factura",
    buscar_siniestro: "Busqueda de siniestro",
    analizar_taller: "Analisis de taller",
    listar_alertas: "Casos criticos",
    priorizar_revision: "Prioridad de revision",
    comparar_tarifario: "Comparacion tarifaria",
    detectar_duplicado: "Duplicados",
    explicar_regla: "Reglas de auditoria",
    consulta_dashboard: "Estado general",
    recomendacion_auditor: "Recomendacion",
    seguimiento_contextual: "Seguimiento",
    saludo: "Disponible",
    ayuda: "Ayuda",
    desconocido: "Consulta",
  };
  return labels[intent];
}
