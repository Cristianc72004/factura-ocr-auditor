"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InvoiceStatus } from "@/types/invoice";

export function ReviewForm({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: InvoiceStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState<InvoiceStatus>(currentStatus);
  const [reviewerName, setReviewerName] = useState("Auditor humano");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    await fetch("/api/cases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: invoiceId, status, reviewerName, comment }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="rounded border border-line bg-white p-5 shadow-subtle">
      <h2 className="mb-3 font-semibold text-ink">Decisión humana</h2>
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-steel">Auditor</span>
          <input className="w-full rounded border border-line px-3 py-2 focus-ring" value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-steel">Decisión</span>
          <select className="w-full rounded border border-line px-3 py-2 focus-ring" value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus)}>
            <option value="approved">Aprobada</option>
            <option value="observed">Observada</option>
            <option value="rejected">Rechazada</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-steel">Comentario</span>
          <textarea className="min-h-28 w-full rounded border border-line px-3 py-2 focus-ring" value={comment} onChange={(event) => setComment(event.target.value)} />
        </label>
        <button className="focus-ring w-full rounded bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={submit}>
          Guardar revisión
        </button>
      </div>
    </section>
  );
}
