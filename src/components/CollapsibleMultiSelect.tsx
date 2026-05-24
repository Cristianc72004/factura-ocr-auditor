"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleMultiSelect({
  title,
  summary,
  children,
  className,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("rounded border border-line bg-white", className)}>
      <button className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left" type="button" onClick={() => setOpen((value) => !value)}>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">{title}</span>
          <span className="block truncate text-xs text-steel">{summary}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-steel transition", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-line bg-surface p-3">{children}</div>}
    </div>
  );
}
