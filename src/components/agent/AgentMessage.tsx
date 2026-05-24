import { cn } from "@/lib/utils";

export function AgentMessage({ role, content }: { role: "admin" | "agent"; content: string }) {
  const parts = role === "agent" ? content.split(/\s(?=[A-D]\.\s)/).filter(Boolean) : [content];

  return (
    <div className={cn("flex", role === "admin" ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] rounded px-3 py-2 text-sm", role === "admin" ? "bg-navy text-white" : "bg-surface text-ink")}>
        {parts.length > 1 ? (
          <div className="space-y-2">
            {parts.map((part) => (
              <p key={part}>{part}</p>
            ))}
          </div>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
