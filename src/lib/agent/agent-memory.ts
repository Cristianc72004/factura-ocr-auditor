import type { AgentIntent } from "./agent-types";

export type AgentMemoryMessage = {
  role: "admin" | "agent";
  content: string;
};

export type AgentSessionMemory = {
  sessionId: string;
  lastMessages: AgentMemoryMessage[];
  lastInvoiceNumber?: string;
  lastClaimNumber?: string;
  lastTopic?: string;
  lastIntent?: AgentIntent;
};

const sessions = new Map<string, AgentSessionMemory>();
const MAX_MESSAGES = 8;

export function getAgentMemory(sessionId: string) {
  const existing = sessions.get(sessionId);
  if (existing) return existing;
  const memory: AgentSessionMemory = { sessionId, lastMessages: [] };
  sessions.set(sessionId, memory);
  return memory;
}

export function updateAgentMemory(sessionId: string, update: Partial<Omit<AgentSessionMemory, "sessionId" | "lastMessages">> & { userMessage?: string; agentReply?: string }) {
  const memory = getAgentMemory(sessionId);
  if (update.userMessage) memory.lastMessages.push({ role: "admin", content: update.userMessage });
  if (update.agentReply) memory.lastMessages.push({ role: "agent", content: update.agentReply });
  memory.lastMessages = memory.lastMessages.slice(-MAX_MESSAGES);
  if (update.lastInvoiceNumber) memory.lastInvoiceNumber = update.lastInvoiceNumber;
  if (update.lastClaimNumber) memory.lastClaimNumber = update.lastClaimNumber;
  if (update.lastTopic) memory.lastTopic = update.lastTopic;
  if (update.lastIntent) memory.lastIntent = update.lastIntent;
  sessions.set(sessionId, memory);
  return memory;
}
