import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent/agent-core";
import type { AgentRequest } from "@/lib/agent/agent-types";

export async function POST(request: Request) {
  const body = (await request.json()) as AgentRequest;
  if (!body.message?.trim()) {
    return NextResponse.json({ success: false, error: "Mensaje vacio." }, { status: 400 });
  }
  const response = await runAgent({
    ...body,
    sessionId: body.sessionId || "default-admin-session",
  });
  return NextResponse.json(response);
}
