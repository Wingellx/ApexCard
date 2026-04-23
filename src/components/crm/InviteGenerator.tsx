"use client";

import { useState } from "react";
import { Link2, Copy, Check, Plus, Clock, CheckCircle2, Mail, UserCog } from "lucide-react";

type Token = {
  id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

interface InviteGeneratorProps {
  existingTokens: Token[];
  teamId?: string;
}

export default function InviteGenerator({ existingTokens, teamId }: InviteGeneratorProps) {
  const [tokens, setTokens]       = useState<Token[]>(existingTokens);
  const [email, setEmail]         = useState("");
  const [role, setRole]           = useState<"member" | "offer_owner">("member");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [copied, setCopied]       = useState<string | null>(null);
  const [sent, setSent]           = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSent(false);
    try {
      const body: Record<string, string> = { invitedRole: role };
      if (email.trim() && email.includes("@")) body.email = email.trim();
      if (teamId) body.teamId = teamId;

      const res  = await fetch("/api/crm/invite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to generate token."); return; }
      setTokens(prev => [
        { id: crypto.randomUUID(), token: data.token, expires_at: data.expires_at, used_at: null, created_at: new Date().toISOString() },
        ...prev,
      ]);
      if (email.trim()) { setSent(true); setEmail(""); }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function hoursLeft(expiresAt: string) {
    return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));
  }

  const activeTokens  = tokens.filter(t => !t.used_at && new Date(t.expires_at) > new Date());
  const usedOrExpired = tokens.filter(t =>  t.used_at || new Date(t.expires_at) <= new Date());

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-indigo-400" />
        <h2 className="text-sm font-semibold text-[#f0f2f8]">Invite Members</h2>
      </div>

      <form onSubmit={handleGenerate} className="space-y-2">
        {/* Role selector */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 shrink-0">
            <UserCog className="w-3.5 h-3.5 text-[#4b5563]" />
            <select
              value={role}
              onChange={e => setRole(e.target.value as "member" | "offer_owner")}
              className="bg-transparent text-sm text-[#f0f2f8] focus:outline-none cursor-pointer"
            >
              <option value="member">Member</option>
              <option value="offer_owner">Offer Owner</option>
            </select>
          </div>
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#374151]" />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setSent(false); }}
              placeholder="invitee@email.com (optional)"
              className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg pl-8 pr-3 py-2 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-colors disabled:opacity-50 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {loading ? "Sending…" : email.trim() ? "Send invite" : "New invite"}
          </button>
        </div>
        {role === "offer_owner" && (
          <p className="text-[11px] text-amber-400/70 pl-1">
            Offer Owner — content CRM access only; cannot see leaderboard or daily logs.
          </p>
        )}
      </form>

      {sent && (
        <div className="flex items-center gap-2 text-emerald-400 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" /> Invite email sent.
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}

      {activeTokens.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Active tokens</p>
          {activeTokens.map(t => (
            <div key={t.id} className="bg-[#0d0f15] border border-[#1e2130] rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm font-mono font-bold text-indigo-300 tracking-widest">{t.token}</code>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#4b5563] flex items-center gap-1">
                    <Clock className="w-3 h-3" />{hoursLeft(t.expires_at)}h left
                  </span>
                  <button onClick={() => copyText(t.token, `code-${t.id}`)} className="text-[#4b5563] hover:text-[#9ca3af] transition-colors" title="Copy code">
                    {copied === `code-${t.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#4b5563] truncate flex-1">{appUrl}/join/crm/{t.token}</span>
                <button onClick={() => copyText(`${appUrl}/join/crm/${t.token}`, `link-${t.id}`)} className="shrink-0 text-[#4b5563] hover:text-[#9ca3af] transition-colors" title="Copy link">
                  {copied === `link-${t.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTokens.length === 0 && usedOrExpired.length === 0 && (
        <p className="text-xs text-[#4b5563]">No active invites. Generate one above to invite a team member.</p>
      )}

      {usedOrExpired.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Previous</p>
          {usedOrExpired.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#0d0f15] border border-[#1e2130]">
              <code className="text-xs font-mono text-[#374151]">{t.token}</code>
              <span className="flex items-center gap-1 text-[11px] text-[#374151]">
                {t.used_at
                  ? <><CheckCircle2 className="w-3 h-3 text-emerald-500/50" /> Used</>
                  : <><Clock className="w-3 h-3" /> Expired</>
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
