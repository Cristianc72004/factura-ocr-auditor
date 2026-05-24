import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AgentInsight } from "@/lib/agent/agent-types";

const tones = {
  neutral: "border-line bg-white text-ink",
  success: "border-emerald-200 bg-emerald-50 text-approved",
  warning: "border-amber-200 bg-amber-50 text-observed",
  danger: "border-red-200 bg-red-50 text-rejected",
};

export function AgentInsightCard({ insight }: { insight: AgentInsight }) {
  const body = (
    <div className={cn("rounded border p-2 text-xs", tones[insight.tone || "neutral"])}>
      <p className="font-semibold">{insight.label}</p>
      <p>{insight.value}</p>
    </div>
  );
  return insight.href ? <Link href={insight.href}>{body}</Link> : body;
}
