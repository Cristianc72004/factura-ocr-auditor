"use client";

export function OcrPreview({ rawText, onChange }: { rawText: string; onChange: (value: string) => void }) {
  return (
    <div className="rounded border border-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-ink">Texto OCR bruto</h2>
        <span className="text-xs font-medium text-steel">{rawText.length} caracteres</span>
      </div>
      <textarea
        className="min-h-64 w-full resize-y rounded border border-line bg-surface p-3 text-sm text-ink focus-ring"
        value={rawText}
        onChange={(event) => onChange(event.target.value)}
        placeholder="El texto reconocido aparecerá aquí. También puedes pegar texto de una factura para simular OCR."
      />
    </div>
  );
}
