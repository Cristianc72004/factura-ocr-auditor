import type { AgentContextBlock } from "./agent-context";
import type { AgentSessionMemory } from "./agent-memory";
import type { AgentIntent } from "./agent-types";

type PromptInput = {
  message: string;
  intent: AgentIntent;
  contextBlocks: AgentContextBlock[];
  data: unknown;
  memory: AgentSessionMemory;
};

function compactJson(value: unknown) {
  return JSON.stringify(value, null, 2).slice(0, 1800);
}

export function buildAgentPrompt({ message, intent, contextBlocks, data, memory }: PromptInput) {
  const context = contextBlocks.slice(0, 2).map((block) => `${block.title}: ${block.content}`).join("\n");
  const recent = memory.lastMessages.slice(-2).map((item) => `${item.role}: ${item.content.slice(0, 220)}`).join("\n");

  return `SYSTEM:
Eres el asistente interno del sistema Auditor Agentico de Facturacion de Siniestros.

CONTEXTO:
${context}

MEMORIA BREVE:
${recent || "Sin mensajes previos."}
Ultima factura: ${memory.lastInvoiceNumber || "sin dato"}
Ultimo siniestro: ${memory.lastClaimNumber || "sin dato"}
Ultimo tema: ${memory.lastTopic || "sin dato"}

INTENCION:
${intent}

DATOS:
${compactJson(data)}

PREGUNTA:
${message}

INSTRUCCIONES:
Responde en espanol claro, breve y profesional.
No inventes datos. Pide numero de factura o siniestro solo cuando la pregunta sea sobre un caso concreto.
Si la pregunta es general, responde general sin forzar datos de factura.
Usa solo el contexto y los datos entregados.
Para estados, explica: approved aprobado automaticamente, observed requiere revision humana, rejected indica bloqueo o riesgo alto.
Maximo 5 lineas. Evita introducciones largas.`;
}
