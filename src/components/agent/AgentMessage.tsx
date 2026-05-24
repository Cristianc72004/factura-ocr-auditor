import { cn } from "@/lib/utils";

export function AgentMessage({
  role,
  content,
  suggestions = [],
  onPick,
}: {
  role: "admin" | "agent";
  content: string;
  suggestions?: string[];
  onPick?: (value: string) => void;
}) {
  const parts = role === "agent" ? content.split(/\n+/).filter(Boolean) : [content];

  return (
    <div className={cn("flex", role === "admin" ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] rounded px-3 py-2 text-sm", role === "admin" ? "bg-navy text-white" : "bg-surface text-ink")}>
        {parts.length > 1 ? (
          <div className="space-y-2">
            {parts.map((part) => (
              <p key={part} className={part.match(/^\d+\./) ? "pl-1" : undefined}>{part}</p>
            ))}
          </div>
        ) : (
          content
        )}
        {role === "agent" && suggestions.length > 0 && onPick && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-2">
            {suggestions.map((suggestion) => (
              <button key={suggestion} className="rounded border border-line bg-white px-2 py-1 text-xs font-semibold text-navy hover:bg-white/80" type="button" onClick={() => onPick(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
