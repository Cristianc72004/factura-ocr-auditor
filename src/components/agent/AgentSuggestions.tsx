export function AgentSuggestions({ suggestions, onPick }: { suggestions: string[]; onPick: (value: string) => void }) {
  if (!suggestions.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button key={suggestion} className="rounded border border-line bg-white px-2 py-1 text-xs font-medium text-navy hover:bg-surface" onClick={() => onPick(suggestion)}>
          {suggestion}
        </button>
      ))}
    </div>
  );
}
