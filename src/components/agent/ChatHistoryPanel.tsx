"use client";

import { Plus, Trash2 } from "lucide-react";
import type { StoredChat } from "@/lib/agent/chat-history";
import { formatDate } from "@/lib/utils";

export function ChatHistoryPanel({
  chats,
  activeId,
  onOpen,
  onNew,
  onDelete,
}: {
  chats: StoredChat[];
  activeId?: string;
  onOpen: (chat: StoredChat) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded border border-line bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-steel">Historial</p>
        <button className="grid size-8 place-items-center rounded border border-line text-navy" type="button" title="Nuevo chat" onClick={onNew}>
          <Plus className="size-4" />
        </button>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto">
        {chats.length ? chats.map((chat) => (
          <div key={chat.id} className={activeId === chat.id ? "rounded border border-navy bg-surface p-2" : "rounded border border-line p-2"}>
            <button className="block w-full text-left" type="button" onClick={() => onOpen(chat)}>
              <span className="block truncate text-sm font-semibold text-ink">{chat.title}</span>
              <span className="text-xs text-steel">{formatDate(chat.updatedAt)}</span>
            </button>
            <button className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rejected" type="button" onClick={() => onDelete(chat.id)}>
              <Trash2 className="size-3" />
              Borrar
            </button>
          </div>
        )) : <p className="rounded bg-surface p-2 text-xs text-steel">Aún no hay conversaciones guardadas.</p>}
      </div>
    </div>
  );
}
