import type { AuditAlert } from "@/types/audit";
import type { Claim } from "@/types/claim";
import type { InvoiceRecord } from "@/types/invoice";
import type { InsurancePolicy, WorkshopAgreement } from "@/types/policy";
import type { TariffItem } from "@/types/tariff";

export type AgentIntent =
  | "resumen_caso"
  | "explicar_alerta"
  | "buscar_factura"
  | "buscar_siniestro"
  | "analizar_taller"
  | "listar_alertas"
  | "priorizar_revision"
  | "comparar_tarifario"
  | "detectar_duplicado"
  | "explicar_regla"
  | "consulta_dashboard"
  | "recomendacion_auditor"
  | "seguimiento_contextual"
  | "saludo"
  | "ayuda"
  | "desconocido";

export type AgentRequest = {
  message: string;
  sessionId: string;
  currentCaseId?: string;
  currentInvoiceId?: string;
  pageContext?: "dashboard" | "case_detail" | "tariffs" | "cases" | "claims" | "clients" | "workshops" | "generator" | "upload";
};

export type AgentPlan = {
  intent: AgentIntent;
  needs: string[];
  invoiceNumber?: string;
  claimNumber?: string;
  workshopName?: string;
};

export type AgentContext = {
  currentInvoice?: InvoiceRecord | null;
  matchedInvoice?: InvoiceRecord | null;
  matchedClaim?: Claim | null;
  invoices: InvoiceRecord[];
  claims: Claim[];
  policies: InsurancePolicy[];
  workshops: WorkshopAgreement[];
  tariffs: TariffItem[];
  alerts: AuditAlert[];
  dashboard: {
    total: number;
    approved: number;
    observed: number;
    rejected: number;
    criticalAlerts: number;
    policies: number;
    claims: number;
    workshops: number;
    tariffs: number;
  };
};

export type AgentInsight = {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  href?: string;
};

export type AgentResult = {
  reply: string;
  confidence: number;
  sources: string[];
  reasoning: string[];
  insights: AgentInsight[];
};

export type AgentResponse = {
  success: boolean;
  reply: string;
  intent: AgentIntent;
  contextUsed: string[];
  suggestions: string[];
  insights: AgentInsight[];
};

export type ConversationMemory = {
  sessionId: string;
  currentInvoiceId?: string;
  currentInvoiceNumber?: string;
  currentClaimNumber?: string;
  currentWorkshopName?: string;
  lastIntent?: AgentIntent;
  lastMessages: { role: "admin" | "agent"; content: string }[];
};
