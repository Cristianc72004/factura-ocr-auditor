import type { AgentResult } from "./agent-types";

export function composeResponse(result: AgentResult) {
  return result.reply;
}

export function contextUsed(result: AgentResult) {
  return result.sources;
}
