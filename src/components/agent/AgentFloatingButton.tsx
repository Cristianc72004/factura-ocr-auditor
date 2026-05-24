"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { AgentChatPanel } from "./AgentChatPanel";

export function AgentFloatingButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-white shadow-lg"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="size-4" />
        Asistente
      </button>
      <AgentChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
