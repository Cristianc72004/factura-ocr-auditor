"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { AgentChatPanel } from "@/components/agent/AgentChatPanel";

export function AgentFloatingButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-40 w-[min(96vw,760px)]">
          <AgentChatPanel />
        </div>
      )}
      <button
        className="focus-ring fixed bottom-5 right-5 z-50 grid size-12 place-items-center rounded-full bg-navy text-white shadow-subtle"
        type="button"
        aria-label={open ? "Cerrar agente" : "Abrir agente"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
    </>
  );
}
