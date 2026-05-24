"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, FilePlus2, FileSearch, Gauge, Home, ShieldAlert, TableProperties, UploadCloud, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/claims", label: "Siniestros", icon: ShieldAlert },
  { href: "/workshops", label: "Talleres", icon: Wrench },
  { href: "/tariffs", label: "Tarifario", icon: TableProperties },
  { href: "/upload", label: "Carga", icon: UploadCloud },
  { href: "/generator", label: "Generador", icon: FilePlus2 },
  { href: "/cases", label: "Casos", icon: FileSearch },
];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen min-w-0 bg-surface">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-white lg:block">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="grid size-11 place-items-center rounded bg-navy text-white">
            <ClipboardCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">Auditor Agentico</p>
            <p className="text-xs text-steel">Facturacion de siniestros</p>
          </div>
        </div>
        <nav className="space-y-1 px-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-steel transition hover:bg-surface hover:text-navy",
                  active && "bg-navy text-white hover:bg-navy hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mb-3 flex items-center gap-2 font-semibold text-navy">
            <ClipboardCheck className="size-5" />
            Auditor Agentico
          </div>
          <nav className="grid grid-cols-4 gap-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "grid place-items-center rounded border border-line py-2 text-xs text-steel",
                    active && "border-navy bg-navy text-white",
                  )}
                  aria-label={item.label}
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-screen-2xl min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
