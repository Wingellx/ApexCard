"use client";

import { useState } from "react";
import ContentLogForm from "./ContentLogForm";
import type { ContentPost } from "@/lib/crm-queries";
import { CheckCircle2 } from "lucide-react";

export default function ContentLogFormClient({ teamId }: { teamId: string }) {
  const [recent, setRecent] = useState<ContentPost[]>([]);

  function handlePosted(post: ContentPost) {
    setRecent(prev => [post, ...prev]);
  }

  return (
    <div className="space-y-4">
      <ContentLogForm teamId={teamId} onPosted={handlePosted} />
      {recent.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Just logged</p>
          {recent.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-[#0d0f15] border border-[#1e2130] rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#f0f2f8] font-semibold truncate">{p.platform} · {p.content_type}</p>
                <p className="text-xs text-[#4b5563]">{p.date_posted} · {p.views.toLocaleString()} views · {Math.round(Number(p.content_score) * 100)}% score</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
