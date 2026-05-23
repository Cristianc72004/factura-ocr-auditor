import { formatCurrency } from "@/lib/utils";
import type { InvoiceItem } from "@/types/invoice";

export function InvoiceItemsTable({ items }: { items: InvoiceItem[] }) {
  return (
    <div className="overflow-x-auto rounded border border-line bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-surface text-xs uppercase text-steel">
          <tr>
            <th className="px-4 py-3">Descripción</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3 text-right">Cant.</th>
            <th className="px-4 py-3 text-right">Unitario</th>
            <th className="px-4 py-3 text-right">Horas</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item, index) => (
            <tr key={item.id ?? `${item.description}-${index}`}>
              <td className="px-4 py-3 font-medium text-ink">{item.description}</td>
              <td className="px-4 py-3 text-steel">{item.category}</td>
              <td className="px-4 py-3 text-right text-steel">{item.quantity}</td>
              <td className="px-4 py-3 text-right text-steel">{formatCurrency(item.unitPrice)}</td>
              <td className="px-4 py-3 text-right text-steel">{item.laborHours}</td>
              <td className="px-4 py-3 text-right font-semibold text-ink">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
