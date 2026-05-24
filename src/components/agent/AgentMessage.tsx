import { cn } from "@/lib/utils";

export function AgentMessage({ role, content }: { role: "admin" | "agent"; content: string }) {
  return (
    <div className={cn("flex", role === "admin" ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] rounded px-3 py-2 text-sm", role === "admin" ? "bg-navy text-white" : "bg-surface text-ink")}>
        {content}
      </div>
    </div>
  );
}
