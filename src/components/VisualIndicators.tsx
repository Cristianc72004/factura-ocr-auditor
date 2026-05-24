import { AlertTriangle, CheckCircle2, Circle, CircleDot, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneStyles: Record<Tone, string> = {
  neutral: "border-line bg-white text-steel",
  success: "border-emerald-200 bg-emerald-50 text-approved",
  warning: "border-amber-200 bg-amber-50 text-observed",
  danger: "border-red-200 bg-red-50 text-rejected",
  info: "border-blue-200 bg-blue-50 text-navy",
};

export function WorkflowSteps({
  steps,
}: {
  steps: { label: string; status: "done" | "current" | "pending" | "blocked" }[];
}) {
  return (
    <div className="grid gap-2 rounded border border-line bg-white p-3 shadow-subtle sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, index) => {
        const Icon = step.status === "done" ? CheckCircle2 : step.status === "blocked" ? XCircle : step.status === "current" ? CircleDot : Circle;
        return (
          <div
            key={`${step.label}-${index}`}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded border px-3 py-2 text-sm",
              step.status === "done" && toneStyles.success,
              step.status === "current" && toneStyles.info,
              step.status === "blocked" && toneStyles.danger,
              step.status === "pending" && toneStyles.neutral,
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate font-semibold">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function RiskMeter({ score, label = "Riesgo" }: { score: number; label?: string }) {
  const bounded = Math.max(0, Math.min(100, Math.round(score || 0)));
  const tone: Tone = bounded >= 71 ? "danger" : bounded >= 31 ? "warning" : "success";
  return (
    <div className="min-w-[120px]">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-steel">{label}</span>
        <span className={cn("font-semibold", tone === "danger" && "text-rejected", tone === "warning" && "text-observed", tone === "success" && "text-approved")}>{bounded}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-line">
        <div className={cn("h-full rounded", tone === "danger" && "bg-rejected", tone === "warning" && "bg-observed", tone === "success" && "bg-approved")} style={{ width: `${bounded}%` }} />
      </div>
    </div>
  );
}

export function ConfidenceMeter({ value, valid }: { value: number; valid?: boolean }) {
  const percent = Math.max(0, Math.min(100, Math.round((value || 0) * 100)));
  const tone: Tone = valid === false ? "danger" : percent >= 75 ? "success" : percent >= 45 ? "warning" : "info";
  return (
    <div className={cn("rounded border p-3", toneStyles[tone])}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">Confianza OCR</span>
        <span className="font-semibold">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-white/70">
        <div className={cn("h-full rounded", tone === "danger" && "bg-rejected", tone === "warning" && "bg-observed", tone === "success" && "bg-approved", tone === "info" && "bg-navy")} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function CompletenessIndicator({
  label,
  completed,
  total,
}: {
  label: string;
  completed: number;
  total: number;
}) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const tone: Tone = percent >= 90 ? "success" : percent >= 60 ? "warning" : "danger";
  return (
    <div className={cn("rounded border p-3", toneStyles[tone])}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="font-semibold">{completed}/{total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-white/70">
        <div className={cn("h-full rounded", tone === "danger" && "bg-rejected", tone === "warning" && "bg-observed", tone === "success" && "bg-approved")} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function StatusHint({
  tone = "info",
  title,
  value,
}: {
  tone?: Tone;
  title: string;
  value: string;
}) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "danger" ? XCircle : tone === "warning" ? AlertTriangle : CircleDot;
  return (
    <div className={cn("flex items-center gap-3 rounded border p-3", toneStyles[tone])}>
      <Icon className="size-5 shrink-0" />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide">{title}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
