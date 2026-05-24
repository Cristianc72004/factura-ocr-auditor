import type { AgentIntent, ConversationMemory } from "./agent-types";

const store = new Map<string, ConversationMemory>();

export function getMemory(sessionId: string): ConversationMemory {
  if (!store.has(sessionId)) {
    store.set(sessionId, { sessionId, lastMessages: [] });
  }
  return store.get(sessionId)!;
}

export function updateMemory(
  sessionId: string,
  input: { adminMessage: string; agentReply: string; intent: AgentIntent; invoiceId?: string; invoiceNumber?: string; claimNumber?: string; workshopName?: string },
) {
  const memory = getMemory(sessionId);
  memory.lastIntent = input.intent;
  memory.currentInvoiceId = input.invoiceId ?? memory.currentInvoiceId;
  memory.currentInvoiceNumber = input.invoiceNumber ?? memory.currentInvoiceNumber;
  memory.currentClaimNumber = input.claimNumber ?? memory.currentClaimNumber;
  memory.currentWorkshopName = input.workshopName ?? memory.currentWorkshopName;
  memory.lastMessages = [
    ...memory.lastMessages,
    { role: "admin" as const, content: input.adminMessage },
    { role: "agent" as const, content: input.agentReply },
  ].slice(-10);
}
