import { formatCurrency } from "@/lib/utils";
import type { TariffItem } from "@/types/tariff";

export function TariffTable({ tariffs }: { tariffs: TariffItem[] }) {
  return (
    <div className="w-full overflow-x-auto rounded border border-line bg-white shadow-subtle">
      <table className="w-full min-w-full text-left text-sm">
        <thead className="bg-surface text-xs uppercase text-steel">
          <tr>
            <th className="px-5 py-3">Código</th>
            <th className="px-5 py-3">Descripción</th>
            <th className="px-5 py-3">Categoría</th>
            <th className="px-5 py-3 text-right">Precio máx.</th>
            <th className="px-5 py-3 text-right">Horas máx.</th>
            <th className="px-5 py-3">Autorizado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {tariffs.map((item) => (
            <tr key={item.id}>
              <td className="px-5 py-3 font-medium text-navy">{item.code}</td>
              <td className="px-5 py-3 text-ink">{item.description}</td>
              <td className="px-5 py-3 text-steel">{item.category}</td>
              <td className="px-5 py-3 text-right font-semibold">{formatCurrency(item.maxUnitPrice)}</td>
              <td className="px-5 py-3 text-right text-steel">{item.maxLaborHours}</td>
              <td className="px-5 py-3 text-steel">{item.authorized ? "Sí" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
