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
    id: "explain",
    title: "Primero: flujo",
    detail: "Entiende el orden correcto antes de cargar datos o facturas.",
    prompt: "Explicame paso a paso el flujo para usar el sistema.",
    icon: "help",
  },
  {
    id: "clients",
    title: "Clientes y polizas",
    detail: "Carga asegurado, vehiculo, placa, cobertura y limite.",
    href: "/clients",
    icon: "dashboard",
  },
  {
    id: "claims",
    title: "Reporte de siniestro",
    detail: "Registra dano, factura informada y servicios autorizados.",
    href: "/claims",
    icon: "claims",
  },
  {
    id: "tariffs",
    title: "Tarifario",
    detail: "Define precios maximos, horas y conceptos autorizados.",
    href: "/tariffs",
    icon: "tariffs",
  },
  {
    id: "upload",
    title: "Factura del taller",
    detail: "Despues del reporte, carga el documento para auditar.",
    href: "/upload",
    icon: "upload",
  },
  {
    id: "generator",
    title: "Generar ejemplo",
    detail: "Crea facturas DigitFlow basadas en un siniestro.",
    href: "/generator",
    icon: "generator",
  },
  {
    id: "critical",
    title: "Casos criticos",
    detail: "Abre la revision humana de observadas o rechazadas.",
    href: "/cases",
    icon: "cases",
  },
  {
    id: "rules",
    title: "Que valida",
    detail: "Pregunta por reglas de duplicados, impuestos y tarifario.",
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
          <button key={action.id} className="focus-ring group min-w-0 rounded border border-line bg-white p-3 text-left transition hover:border-navy/50 hover:bg-surface" type="button" onClick={() => run(action)}>
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
