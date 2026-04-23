"use client";

import { useState, useMemo } from "react";
import { ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import type { ContentPost } from "@/lib/crm-queries";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", tiktok: "TikTok",
  youtube: "YouTube", youtube_shorts: "YT Shorts",
};
const CONTENT_TYPE_LABELS: Record<string, string> = {
  educational: "Educational", entertaining: "Entertaining",
  testimonial: "Testimonial", behind_the_scenes: "Behind Scenes",
  offer_promotional: "Offer Promo", pain_point: "Pain Point",
  authority_credibility: "Authority", trend_reactive: "Trend",
  case_study: "Case Study", engagement_bait: "Engagement",
};

type SortKey = "date_posted" | "platform" | "content_type" | "views" | "performance_rating" | "content_score";

interface Props {
  posts: ContentPost[];
}

export default function ContentTable({ posts }: Props) {
  const [platform, setPlatform]   = useState("");
  const [ctype,    setCtype]      = useState("");
  const [sortKey,  setSortKey]    = useState<SortKey>("date_posted");
  const [sortAsc,  setSortAsc]    = useState(false);

  const platforms  = useMemo(() => [...new Set(posts.map(p => p.platform))].sort(), [posts]);
  const ctypes     = useMemo(() => [...new Set(posts.map(p => p.content_type))].sort(), [posts]);

  const filtered = useMemo(() => {
    let rows = posts;
    if (platform) rows = rows.filter(p => p.platform === platform);
    if (ctype)    rows = rows.filter(p => p.content_type === ctype);
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  }, [posts, platform, ctype, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  const selCls = "bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-xs text-[#f0f2f8] focus:outline-none focus:border-indigo-500 transition-colors";

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 text-[#374151]" />;
    return sortAsc
      ? <ChevronUp   className="w-3 h-3 text-indigo-400" />
      : <ChevronDown className="w-3 h-3 text-indigo-400" />;
  }

  function Th({ label, k }: { label: string; k: SortKey }) {
    return (
      <th
        onClick={() => toggleSort(k)}
        className="px-3 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider text-right cursor-pointer select-none hover:text-[#9ca3af] transition-colors last:pr-4"
      >
        <span className="inline-flex items-center gap-1 justify-end">
          {label}<SortIcon k={k} />
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={platform} onChange={e => setPlatform(e.target.value)} className={selCls}>
          <option value="">All platforms</option>
          {platforms.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p] ?? p}</option>)}
        </select>
        <select value={ctype} onChange={e => setCtype(e.target.value)} className={selCls}>
          <option value="">All types</option>
          {ctypes.map(c => <option key={c} value={c}>{CONTENT_TYPE_LABELS[c] ?? c}</option>)}
        </select>
        <span className="ml-auto text-xs text-[#4b5563] self-center">{filtered.length} post{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-[#4b5563] py-4">No posts match the current filters.</p>
      ) : (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1e2130]">
                <th className="px-3 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider text-left pl-4">Date</th>
                <th className="px-3 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider text-left">Logger</th>
                <Th label="Platform"   k="platform"    />
                <Th label="Type"       k="content_type" />
                <Th label="Views"      k="views"        />
                <Th label="Rating"     k="performance_rating" />
                <Th label="Score"      k="content_score" />
                <th className="px-3 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider pr-4">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2130]">
              {filtered.map(p => {
                const scorePct = Math.round(Number(p.content_score) * 100);
                const scoreColor = scorePct >= 70 ? "text-emerald-400" : scorePct >= 40 ? "text-amber-400" : "text-rose-400";
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2.5 text-[#6b7280] text-xs whitespace-nowrap pl-4">{p.date_posted}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs max-w-[120px] truncate">
                      {p.profiles?.full_name || p.profiles?.email || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-right">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[11px]">
                        {PLATFORM_LABELS[p.platform] ?? p.platform}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">
                      {CONTENT_TYPE_LABELS[p.content_type] ?? p.content_type}
                    </td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{p.views.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{p.performance_rating}/10</td>
                    <td className={`px-3 py-2.5 text-xs text-right font-bold ${scoreColor}`}>{scorePct}%</td>
                    <td className="px-3 py-2.5 text-xs text-right pr-4">
                      {p.post_url ? (
                        <a href={p.post_url} target="_blank" rel="noopener noreferrer"
                          className="text-[#4b5563] hover:text-indigo-400 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : <span className="text-[#2d3748]">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
