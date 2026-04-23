"use client";

import { useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import type { ContentPost } from "@/lib/crm-queries";

const PLATFORMS = [
  { value: "instagram",      label: "Instagram"       },
  { value: "tiktok",         label: "TikTok"          },
  { value: "youtube",        label: "YouTube"         },
  { value: "youtube_shorts", label: "YouTube Shorts"  },
];

const CONTENT_TYPES = [
  { value: "educational",           label: "Educational"            },
  { value: "entertaining",          label: "Entertaining"           },
  { value: "testimonial",           label: "Testimonial"            },
  { value: "behind_the_scenes",     label: "Behind the Scenes"      },
  { value: "offer_promotional",     label: "Offer Promotional"      },
  { value: "pain_point",            label: "Pain Point"             },
  { value: "authority_credibility", label: "Authority & Credibility"},
  { value: "trend_reactive",        label: "Trend Reactive"         },
  { value: "case_study",            label: "Case Study"             },
  { value: "engagement_bait",       label: "Engagement Bait"        },
];

interface Props {
  teamId: string;
  onPosted: (post: ContentPost) => void;
}

export default function ContentLogForm({ teamId, onPosted }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [platform,   setPlatform]   = useState("instagram");
  const [ctype,      setCtype]      = useState("educational");
  const [date,       setDate]       = useState(today);
  const [url,        setUrl]        = useState("");
  const [views,      setViews]      = useState("");
  const [rating,     setRating]     = useState(5);
  const [notes,      setNotes]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [open,       setOpen]       = useState(true);

  const scorePreview = (() => {
    const baselines: Record<string, number> = { instagram: 1000, tiktok: 5000, youtube: 2000, youtube_shorts: 3000 };
    const v = Number(views) || 0;
    const norm = Math.min(1, v / (baselines[platform] ?? 1000));
    return Math.min(1, norm * 0.5 + (rating / 10) * 0.5) * 100;
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/content", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          teamId,
          platform,
          content_type:      ctype,
          date_posted:       date,
          post_url:          url.trim() || undefined,
          views:             Number(views) || 0,
          performance_rating: rating,
          notes:             notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to log post.");
      onPosted(data as ContentPost);
      setUrl(""); setViews(""); setNotes(""); setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving post.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 transition-colors";
  const labelCls = "block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5";

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-[#f0f2f8]">Log Content Post</span>
        </div>
        <span className="text-[#4b5563] text-xs">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 border-t border-[#1e2130]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div>
              <label className={labelCls}>Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} className={inputCls}>
                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Content Type</label>
              <select value={ctype} onChange={e => setCtype(e.target.value)} className={inputCls}>
                {CONTENT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date Posted</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Post URL <span className="normal-case font-normal text-[#374151]">(optional)</span></label>
              <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Views</label>
              <input type="number" min="0" value={views} onChange={e => setViews(e.target.value)} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>
                Performance Rating
                <span className="ml-2 text-indigo-400 font-bold">{rating}/10</span>
                <span className="ml-2 text-[#4b5563] font-normal normal-case">→ score preview: <span className="text-indigo-300">{scorePreview.toFixed(1)}%</span></span>
              </label>
              <input
                type="range" min="1" max="10" value={rating}
                onChange={e => setRating(Number(e.target.value))}
                className="w-full accent-indigo-500 mt-1"
              />
              <div className="flex justify-between text-[10px] text-[#374151] mt-0.5">
                <span>1</span><span>5</span><span>10</span>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes <span className="normal-case font-normal text-[#374151]">(optional)</span></label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="What worked, what didn't…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit" disabled={loading || !views}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Saving…" : "Log post"}
          </button>
        </form>
      )}
    </div>
  );
}
