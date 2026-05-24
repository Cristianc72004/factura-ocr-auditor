import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AgentFloatingButton } from "@/components/agent/AgentFloatingButton";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auditor Agentico de Facturacion",
  description: "Auditoria automatica de facturas de siniestros vehiculares.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <AgentFloatingButton />
      </body>
    </html>
  );
}
