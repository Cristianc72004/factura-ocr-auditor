"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function OcrPreview({ rawText, onChange }: { rawText: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded border border-line bg-white p-4">
      <button className="flex w-full items-center justify-between gap-3 text-left" type="button" onClick={() => setOpen((value) => !value)}>
        <div>
          <h2 className="font-semibold text-ink">Texto reconocido</h2>
          <p className="mt-1 text-xs text-steel">Opcional: ábrelo solo si necesitas corregir la lectura del documento.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-medium text-steel">{rawText.length} caracteres</span>
          <ChevronDown className={cn("size-4 text-steel transition", open && "rotate-180")} />
        </div>
      </button>
      {open && (
        <textarea
          className="mt-3 min-h-64 w-full resize-y rounded border border-line bg-surface p-3 text-sm text-ink focus-ring"
          value={rawText}
          onChange={(event) => onChange(event.target.value)}
          placeholder="El texto reconocido aparecerá aquí. También puedes pegar texto de una factura para simular OCR."
        />
      )}
    </div>
  );
}
