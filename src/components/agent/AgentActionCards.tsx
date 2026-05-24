"use client";

import { useRouter } from "next/navigation";
import { BarChart3, FilePlus2, FileSearch, HelpCircle, ListChecks, ShieldAlert, TableProperties, UploadCloud } from "lucide-react";

export type AgentAction = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  prompt?: string;
  icon: "upload" | "generator" | "claims" | "tariffs" | "cases" | "dashboard" | "audit" | "help";
};

const iconByName = {
  upload: UploadCloud,
  generator: FilePlus2,
  claims: ShieldAlert,
  tariffs: TableProperties,
  cases: FileSearch,
  dashboard: BarChart3,
  audit: ListChecks,
  help: HelpCircle,
};

export const defaultAgentActions: AgentAction[] = [
  {
    id: "upload",
    title: "Subir factura",
    detail: "Carga PDF, PNG, JPG o DOCX y revisa el OCR antes de auditar.",
    href: "/upload",
    icon: "upload",
  },
  {
    id: "generator",
    title: "Generar ejemplo",
    detail: "Crea facturas DigitFlow para practicar el flujo completo.",
    href: "/generator",
    icon: "generator",
  },
  {
    id: "claims",
    title: "Registrar siniestro",
    detail: "Completa poliza, asegurado, vehiculo y servicios autorizados.",
    href: "/claims",
    icon: "claims",
  },
  {
    id: "tariffs",
    title: "Cargar tarifario",
    detail: "Define precios máximos, horas y conceptos autorizados.",
    href: "/tariffs",
    icon: "tariffs",
  },
  {
    id: "critical",
    title: "Ver casos criticos",
    detail: "Abre la revision humana de facturas observadas o rechazadas.",
    href: "/cases",
    icon: "cases",
  },
  {
    id: "daily",
    title: "Resumen del dia",
    detail: "Pide al agente un estado general de facturas, alertas y base.",
    prompt: "Resume el estado del dia y dime que debo revisar primero.",
    icon: "dashboard",
  },
  {
    id: "explain",
    title: "Como auditar",
    detail: "Recibe pasos y un ejemplo de uso para una factura DigitFlow.",
    prompt: "Explicame paso a paso como usar la pagina para auditar una factura, con un ejemplo.",
    icon: "help",
  },
  {
    id: "rules",
    title: "Que valida el motor",
    detail: "Pregunta por reglas de duplicados, impuestos, tarifario y siniestro.",
    prompt: "Que valida el motor de auditoria y que datos necesito tener cargados?",
    icon: "audit",
  },
];

export function AgentActionCards({
  actions = defaultAgentActions,
  onAsk,
  compact = false,
}: {
  actions?: AgentAction[];
  onAsk?: (prompt: string) => void;
  compact?: boolean;
}) {
  const router = useRouter();

  function run(action: AgentAction) {
    if (action.href) {
      router.push(action.href);
      return;
    }
    if (action.prompt && onAsk) onAsk(action.prompt);
  }

  return (
    <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3"}>
      {actions.map((action) => {
        const Icon = iconByName[action.icon];
        return (
          <button
            key={action.id}
            className="focus-ring group min-w-0 rounded border border-line bg-white p-3 text-left transition hover:border-navy/50 hover:bg-surface"
            type="button"
            onClick={() => run(action)}
          >
            <span className="mb-2 flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded bg-navy text-white">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 font-semibold text-ink">{action.title}</span>
            </span>
            <span className="block text-xs leading-5 text-steel">{action.detail}</span>
          </button>
        );
      })}
    </div>
  );
}
