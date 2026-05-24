"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsedTextBlock({ title, text, emptyText }: { title: string; text?: string; emptyText: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded border border-line bg-white p-5 shadow-subtle">
      <button className="flex w-full items-center justify-between gap-3 text-left" type="button" onClick={() => setOpen((value) => !value)}>
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-xs text-steel">Opcional: abrir solo si necesitas revisar el texto extraído.</p>
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-steel transition", open && "rotate-180")} />
      </button>
      {open && <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-surface p-3 text-sm text-steel">{text || emptyText}</pre>}
    </section>
  );
}
