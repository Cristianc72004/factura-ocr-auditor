"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded border border-line bg-white p-4">
      <button className="flex w-full items-center justify-between gap-3 text-left" type="button" onClick={() => setOpen((value) => !value)}>
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">{title}</h2>
          {summary && <p className="mt-1 truncate text-xs text-steel">{summary}</p>}
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-steel transition", open && "rotate-180")} />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}
