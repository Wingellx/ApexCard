"use client";

import { useState, useTransition } from "react";
import { ExternalLink, CheckCircle2, Circle, Unplug, ChevronDown, Loader2 } from "lucide-react";
import { saveTrelloBoard, disconnectTrello, completeTrelloCard } from "@/app/dashboard/io/trello/actions";
import type { TrelloBoard, TrelloCard } from "@/app/dashboard/io/trello/actions";

interface Props {
  connected: boolean;
  connectUrl: string;
  boards: TrelloBoard[];
  boardId: string | null;
  boardName: string | null;
  cards: TrelloCard[];
}

function formatDue(due: string | null) {
  if (!due) return null;
  const d = new Date(due);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / 86400000);
  if (days < 0)  return { label: "Overdue",     color: "text-rose-400" };
  if (days === 0) return { label: "Due today",   color: "text-amber-400" };
  if (days === 1) return { label: "Due tomorrow",color: "text-amber-400" };
  return { label: `Due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, color: "text-[#6b7280]" };
}

export default function TrelloMissions({ connected, connectUrl, boards, boardId, boardName, cards }: Props) {
  const [completing, setCompleting] = useState<string | null>(null);
  const [localDone, setLocalDone] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [boardPickerOpen, setBoardPickerOpen] = useState(false);

  async function handleComplete(cardId: string) {
    setCompleting(cardId);
    setLocalDone(prev => new Set([...prev, cardId]));
    await completeTrelloCard(cardId);
    setCompleting(null);
  }

  function handleSelectBoard(id: string, name: string) {
    setBoardPickerOpen(false);
    startTransition(async () => { await saveTrelloBoard(id, name); });
  }

  function handleDisconnect() {
    startTransition(async () => { await disconnectTrello(); });
  }

  const visibleCards = cards.filter(c => !localDone.has(c.id));

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
          📋
        </div>
        <p className="font-semibold text-[#f0f2f8] mb-1">Connect Trello</p>
        <p className="text-sm text-[#6b7280] mb-6 max-w-xs mx-auto">
          Link your Trello account to pull cards directly into your IO missions.
        </p>
        <a
          href={connectUrl}
          className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Connect Trello
        </a>
      </div>
    );
  }

  // ── Connected but no board selected ──────────────────────────────────────────
  if (!boardId) {
    return (
      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-[#f0f2f8]">Select a Trello board</p>
          <button
            onClick={handleDisconnect}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs text-[#4b5563] hover:text-rose-400 transition-colors"
          >
            <Unplug className="w-3.5 h-3.5" /> Disconnect
          </button>
        </div>
        {boards.length === 0 ? (
          <p className="text-sm text-[#6b7280]">No boards found. Make sure your Trello account has at least one board.</p>
        ) : (
          <div className="space-y-2">
            {boards.map(b => (
              <button
                key={b.id}
                onClick={() => handleSelectBoard(b.id, b.name)}
                disabled={isPending}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#0d0f15] border border-[#1e2130] hover:border-white/20 rounded-xl text-left text-sm text-[#f0f2f8] font-medium transition-colors disabled:opacity-50"
              >
                {b.name}
                <span className="text-[#374151] text-xs">Select →</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Board selected — show cards ───────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Board header */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setBoardPickerOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#9ca3af] hover:text-white transition-colors"
          >
            📋 {boardName}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {boardPickerOpen && boards.length > 0 && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-[#111318] border border-[#1e2130] rounded-xl shadow-xl min-w-[200px] overflow-hidden">
              {boards.map(b => (
                <button
                  key={b.id}
                  onClick={() => handleSelectBoard(b.id, b.name)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${b.id === boardId ? "text-white bg-white/5" : "text-[#9ca3af] hover:bg-white/5 hover:text-white"}`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          disabled={isPending}
          className="flex items-center gap-1.5 text-xs text-[#374151] hover:text-rose-400 transition-colors"
        >
          <Unplug className="w-3.5 h-3.5" /> Disconnect
        </button>
      </div>

      {/* Cards */}
      {visibleCards.length === 0 ? (
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6 text-center">
          <p className="text-sm text-[#6b7280]">All missions complete. ⚔️</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleCards.map(card => {
            const due = formatDue(card.due);
            const isCompleting = completing === card.id;
            return (
              <div
                key={card.id}
                className="flex items-start gap-3 bg-[#111318] border border-[#1e2130] hover:border-white/10 rounded-xl px-4 py-3.5 transition-colors group"
              >
                <button
                  onClick={() => handleComplete(card.id)}
                  disabled={!!completing}
                  className="shrink-0 mt-0.5 text-[#374151] hover:text-white transition-colors disabled:pointer-events-none"
                  aria-label="Mark complete"
                >
                  {isCompleting
                    ? <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                    : <Circle className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#f0f2f8] leading-snug">{card.name}</p>
                  {card.desc && (
                    <p className="text-xs text-[#4b5563] mt-0.5 truncate">{card.desc}</p>
                  )}
                  {due && (
                    <p className={`text-xs mt-1 font-medium ${due.color}`}>{due.label}</p>
                  )}
                </div>
                <a
                  href={card.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[#2d3748] hover:text-white/40 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
