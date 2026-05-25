import { HomeAgentConsole } from "@/components/HomeAgentConsole";
import { LayoutShell } from "@/components/LayoutShell";

export default function Home() {
  return (
    <LayoutShell>
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl flex-col justify-center">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-steel">Guia del sistema</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">Primero entiende el flujo de auditoria</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-steel">
            El agente empieza explicando el orden correcto: base administrativa, reporte del siniestro, factura del taller, validacion automatica y revision humana.
          </p>
        </div>

        <HomeAgentConsole />
      </div>
    </LayoutShell>
  );
}
