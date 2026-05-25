"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FilePlus2, Send, ShieldAlert, TableProperties, UploadCloud, Users, Wrench } from "lucide-react";
import { AgentMessage } from "@/components/agent/AgentMessage";
import { ChatHistoryPanel } from "@/components/agent/ChatHistoryPanel";
import { chatTitleFrom, createChat, loadChatHistory, saveChatHistory, type StoredChat, type StoredChatMessage } from "@/lib/agent/chat-history";
import { formatCurrency } from "@/lib/utils";
import type { AuditReport } from "@/types/audit";
import type { ExtractedInvoice } from "@/types/invoice";

type Message = StoredChatMessage;
type UploadedFile = { fileName: string; originalName: string; mimeType: string; size: number; filePath?: string; storageKey?: string; url?: string };

const initialHomeMessages: Message[] = [
  {
    role: "agent",
    content:
      "Primero te explico como usar el sistema:\n1. Clientes y polizas: aqui registras a quien esta asegurado, que vehiculo tiene, placa, cobertura, deducible y limite.\n2. Talleres y convenio: aqui registras que talleres pueden facturar y bajo que condiciones.\n3. Tarifario: aqui defines precios maximos, horas maximas y conceptos autorizados.\n4. Reporte de siniestro: aqui cargas lo que reporto el cliente: dano, factura informada y servicios autorizados.\n5. Generador: usalo para crear una factura PDF de prueba basada en un siniestro real del sistema.\n6. Subir factura: aqui entra la factura real o generada, se lee con OCR y se audita.\n7. Casos: aqui revisas el reporte final y decides solo sobre observadas o rechazadas.",
    suggestions: ["Explicar flujo con ejemplo", "Como uso el generador", "Que datos necesito cargar"],
  },
];

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("El servidor devolvio una respuesta invalida.");
  }
}

function emptyInvoice(): ExtractedInvoice {
  return {
    invoiceNumber: "",
    claimNumber: "",
    policyNumber: "",
    workshopName: "",
    workshopTaxId: "",
    customerName: "",
    customerTaxId: "",
    insuredName: "",
    vehicle: "",
    licensePlate: "",
    date: "",
    currency: "",
    cae: "",
    uuid: "",
    fiscalUrl: "",
    observations: "",
    subtotal: 0,
    tax: 0,
    total: 0,
    items: [],
  };
}

export function HomeAgentConsole() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [caseHref, setCaseHref] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialHomeMessages);
  const [chats, setChats] = useState<StoredChat[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "home-session";
    const key = "audit-agent-home-session";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = `home_${Date.now().toString(36)}`;
    window.localStorage.setItem(key, next);
    return next;
  }, []);

  useEffect(() => {
    const stored = loadChatHistory();
    setChats(stored);
    const first = stored[0];
    if (first) {
      setActiveChatId(first.id);
      const firstMessage = first.messages[0]?.content || "";
      setMessages(firstMessage.includes("Primero te explico el flujo correcto") ? first.messages : initialHomeMessages);
      return;
    }
    const chat = createChat(initialHomeMessages);
    setActiveChatId(chat.id);
    setChats([chat]);
    saveChatHistory([chat]);
  }, []);

  function persist(nextMessages: Message[], titleSeed?: string) {
    setChats((current) => {
      const title = titleSeed ? chatTitleFrom(titleSeed) : current.find((chat) => chat.id === activeChatId)?.title || "Nueva conversacion";
      const existingId = activeChatId || `chat_${Date.now().toString(36)}`;
      const updated: StoredChat = { id: existingId, title, updatedAt: new Date().toISOString(), messages: nextMessages };
      const next = [updated, ...current.filter((chat) => chat.id !== existingId)];
      saveChatHistory(next);
      if (!activeChatId) setActiveChatId(existingId);
      return next;
    });
  }

  function addAgent(content: string, suggestions?: string[]) {
    setMessages((current) => {
      const next = [...current, { role: "agent" as const, content, suggestions }];
      persist(next);
      return next;
    });
  }

  async function send(value = input) {
    if (!value.trim()) return;
    if (value === "Subir factura ahora") {
      inputRef.current?.click();
      return;
    }
    setBusy(true);
    setInput("");
    setMessages((current) => {
      const next = [...current, { role: "admin" as const, content: value }];
      persist(next, value);
      return next;
    });
    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value, sessionId, pageContext: "dashboard" }),
      });
      const data = await response.json();
      setMessages((current) => {
        const next = [
          ...current,
          {
            role: "agent" as const,
            content: data.reply || "No pude construir una respuesta.",
            suggestions: data.suggestions?.length ? data.suggestions : ["Explicar flujo completo", "Cargar siniestro", "Subir factura ahora"],
          },
        ];
        persist(next);
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  async function uploadAndAudit(file: File) {
    setBusy(true);
    setCaseHref("");
    setMessages((current) => {
      const next = [...current, { role: "admin" as const, content: `Subir factura: ${file.name}` }];
      persist(next, `Factura ${file.name}`);
      return next;
    });
    addAgent("Recibi la factura. Estoy cargando el archivo y leyendo el PDF para extraer numero de factura, siniestro, taller, items, totales y CAE.");

    try {
      const form = new FormData();
      form.append("file", file);
      const uploadResponse = await fetch("/api/upload", { method: "POST", body: form });
      const uploadData = (await readJsonResponse(uploadResponse)) as UploadedFile & { error?: string };
      if (!uploadResponse.ok) throw new Error(uploadData.error || "No se pudo subir el archivo.");

      addAgent("Archivo cargado. Ahora comparo la factura contra siniestros, polizas, talleres, tarifario y posibles duplicados.");
      const ocrResponse = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadData),
      });
      const ocrData = await readJsonResponse(ocrResponse);
      if (!ocrResponse.ok) throw new Error(ocrData.error || "No se pudo leer el documento.");

      const invoice = { ...emptyInvoice(), ...ocrData.invoice };
      const auditResponse = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice, rawOcrText: ocrData.rawText || "", fileName: uploadData.fileName }),
      });
      const auditData = await readJsonResponse(auditResponse);
      if (!auditResponse.ok) throw new Error(auditData.error || "No se pudo auditar la factura.");

      const report = auditData.report as AuditReport;
      const href = auditData.case?.id ? `/cases/${auditData.case.id}` : "";
      setCaseHref(href);
      addAgent(buildAuditReply(report), href ? ["Abrir caso auditado", "Ver alertas criticas", "Cargar siniestro"] : ["Ver alertas criticas", "Cargar siniestro"]);
    } catch (caught) {
      addAgent(caught instanceof Error ? caught.message : "Ocurrio un error al procesar la factura.", ["Explicar flujo completo", "Cargar siniestro", "Ver tarifario"]);
    } finally {
      setBusy(false);
    }
  }

  function pick(value: string) {
    if (value === "Abrir caso auditado" && caseHref) {
      window.location.href = caseHref;
      return;
    }
    if (value === "Cargar siniestro") {
      window.location.href = "/claims";
      return;
    }
    if (value === "Ver tarifario") {
      window.location.href = "/tariffs";
      return;
    }
    if (value === "Ver alertas criticas") {
      window.location.href = "/cases";
      return;
    }
    void send(value);
  }

  function newChat() {
    const chat = createChat(initialHomeMessages);
    const next = [chat, ...chats];
    setMessages(chat.messages);
    setActiveChatId(chat.id);
    setChats(next);
    saveChatHistory(next);
  }

  function openChat(chat: StoredChat) {
    setActiveChatId(chat.id);
    setMessages(chat.messages);
  }

  function deleteChat(id: string) {
    const next = chats.filter((chat) => chat.id !== id);
    setChats(next);
    saveChatHistory(next);
    if (id === activeChatId) {
      const fallback = next[0] ?? createChat(initialHomeMessages);
      setActiveChatId(fallback.id);
      setMessages(fallback.messages);
      if (!next[0]) {
        setChats([fallback]);
        saveChatHistory([fallback]);
      }
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  return (
    <section className="rounded border border-line bg-white shadow-subtle">
      <div className="border-b border-line p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <ActionLink href="/clients" icon={<Users className="size-4" />} title="1. Clientes y polizas" detail="Base para asegurado, vehiculo, placa y cobertura." />
          <ActionLink href="/workshops" icon={<Wrench className="size-4" />} title="2. Talleres y convenio" detail="Taller habilitado, categorias y monto maximo." />
          <ActionLink href="/tariffs" icon={<TableProperties className="size-4" />} title="3. Tarifario" detail="Precios maximos, horas y conceptos autorizados." />
          <ActionLink href="/claims" icon={<ShieldAlert className="size-4" />} title="4. Reporte de siniestro" detail="Dano reportado, factura informada y servicios." />
          <ActionLink href="/generator" icon={<FilePlus2 className="size-4" />} title="5. Generar ejemplo" detail="Crea un PDF de prueba usando el siniestro seleccionado." />
          <button className="focus-ring rounded border border-line bg-white p-4 text-left transition hover:border-navy/50 hover:bg-surface" type="button" onClick={() => inputRef.current?.click()}>
            <span className="mb-3 grid size-9 place-items-center rounded bg-navy text-white"><UploadCloud className="size-4" /></span>
            <span className="block font-semibold text-ink">6. Subir factura</span>
            <span className="mt-1 block text-sm leading-5 text-steel">OCR, reglas, reporte y clasificacion.</span>
          </button>
        </div>
        <input ref={inputRef} className="sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAndAudit(file); event.target.value = ""; }} />
      </div>

      <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-line bg-surface p-4 lg:border-b-0 lg:border-r">
          <ChatHistoryPanel chats={chats} activeId={activeChatId} onOpen={openChat} onNew={newChat} onDelete={deleteChat} />
        </aside>
        <div className="min-w-0 p-5">
          <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <AgentMessage key={index} role={message.role} content={message.content} suggestions={message.suggestions} onPick={pick} />
            ))}
            {busy && <AgentMessage role="agent" content="Procesando... estoy leyendo el documento y contrastando la cuenta contra reglas de auditoria." />}
          </div>
          <form className="mt-4 flex gap-2" onSubmit={submit}>
            <input
              className="min-w-0 flex-1 rounded border border-line px-3 py-2 text-sm focus-ring"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ej: explicame el flujo para usar el sistema"
            />
            <button className="grid size-10 place-items-center rounded bg-navy text-white disabled:opacity-50" disabled={busy} aria-label="Enviar">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function ActionLink({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <Link className="focus-ring rounded border border-line bg-white p-4 text-left transition hover:border-navy/50 hover:bg-surface" href={href}>
      <span className="mb-3 grid size-9 place-items-center rounded bg-navy text-white">{icon}</span>
      <span className="block font-semibold text-ink">{title}</span>
      <span className="mt-1 block text-sm leading-5 text-steel">{detail}</span>
    </Link>
  );
}

function buildAuditReply(report: AuditReport) {
  if (!report.alerts.length) {
    return `Auditoria lista. Factura ${report.invoice.invoiceNumber || "sin numero"} por ${formatCurrency(report.invoice.total)}. No detecte discrepancias relevantes contra el tarifario, el siniestro o duplicados.`;
  }
  const alerts = report.alerts.slice(0, 3).map((alert, index) => `${index + 1}. ${alert.message}`).join(" ");
  return `Auditoria lista. Detecte ${report.alerts.length} discrepancia(s) con riesgo ${report.riskScore}/100. ${alerts} Revisa el caso para ver item, valor esperado, valor actual y recomendacion.`;
}
