"use client";

import { useActionState, useState } from "react";
import { saveProfile } from "@/app/dashboard/profile/actions";
import Button from "@/components/ui/Button";
import { CheckCircle2, XCircle, Link2, Copy, Check, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  full_name: string | null;
  email: string;
  username: string | null;
  role: string;
  commission_pct: number;
  bio: string;
  leaderboard_opt_in: boolean;
}

interface Props {
  profile: Profile | null;
  appUrl: string;
}

const ROLES = [
  { value: "closer",   label: "Closer"             },
  { value: "setter",   label: "Appointment Setter" },
  { value: "operator", label: "Growth Operator"    },
  { value: "manager",  label: "Sales Manager"      },
];

function isValidUsername(s: string) {
  return /^[a-z0-9_-]{3,30}$/.test(s);
}

export default function ProfileForm({ profile, appUrl }: Props) {
  const [state, formAction, isPending] = useActionState(saveProfile, null);

  const [fullName,      setFullName]      = useState(profile?.full_name      ?? "");
  const [username,      setUsername]      = useState(profile?.username       ?? "");
  const [role,          setRole]          = useState(profile?.role           ?? "closer");
  const [commissionPct, setCommissionPct] = useState(String(profile?.commission_pct ?? ""));
  const [bio,           setBio]           = useState(profile?.bio            ?? "");
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(profile?.leaderboard_opt_in ?? false);
  const [copied,        setCopied]        = useState(false);

  const trimmed     = username.trim().toLowerCase();
  const usernameValid = trimmed.length === 0 || isValidUsername(trimmed);
  const usernameSet   = trimmed.length > 0 && isValidUsername(trimmed);
  const publicUrl     = usernameSet ? `${appUrl}/card/${trimmed}` : null;

  function copyUrl() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass =
    "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";
  const labelClass =
    "block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5";

  return (
    <form action={formAction} className="space-y-4">

      {/* Identity */}
      <div
        className="animate-in bg-[#111318] border border-[#1e2130] rounded-xl p-6 space-y-4"
        style={{ animationDelay: "80ms" }}
      >
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Identity</p>

        <div>
          <label className={labelClass}>Full Name</label>
          <input
            name="full_name"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Alex Johnson"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Username</label>
          <div className="relative">
            <input
              name="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              placeholder="alexjohnson"
              maxLength={30}
              className={cn(
                inputClass,
                "pr-10",
                !usernameValid && "border-rose-500/60 focus:border-rose-500 focus:ring-rose-500"
              )}
            />
            {trimmed.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameValid
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <XCircle      className="w-4 h-4 text-rose-400"    />}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#6b7280] mt-1.5">
            Lowercase letters, numbers, _ or — · 3–30 characters
          </p>
        </div>
      </div>

      {/* URL preview */}
      <div className="animate-in" style={{ animationDelay: "140ms" }}>
        {publicUrl ? (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Link2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <p className="text-sm font-medium text-[#f0f2f8] truncate">{publicUrl}</p>
            </div>
            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
            >
              {copied
                ? <><Check className="w-3.5 h-3.5" /> Copied</>
                : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
        ) : (
          <div className="bg-[#111318] border border-dashed border-[#1e2130] rounded-xl px-5 py-3 flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5 text-[#374151] shrink-0" />
            <p className="text-sm text-[#374151]">
              Set a username to claim your public URL ·{" "}
              <span className="italic">apexcard.com/card/yourname</span>
            </p>
          </div>
        )}
      </div>

      {/* Professional */}
      <div
        className="animate-in bg-[#111318] border border-[#1e2130] rounded-xl p-6 space-y-4"
        style={{ animationDelay: "200ms" }}
      >
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Professional</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Role</label>
            <select
              name="role"
              value={role}
              onChange={e => setRole(e.target.value)}
              className={cn(inputClass, "cursor-pointer")}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Commission Rate</label>
            <div className="relative">
              <input
                name="commission_pct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionPct}
                onChange={e => setCommissionPct(e.target.value)}
                placeholder="10"
                className={cn(inputClass, "pr-8")}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] pointer-events-none">
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div
        className="animate-in bg-[#111318] border border-[#1e2130] rounded-xl p-6"
        style={{ animationDelay: "260ms" }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Bio</p>
          <span className={cn(
            "text-[11px] tabular-nums",
            bio.length > 140 ? "text-amber-400" : "text-[#6b7280]"
          )}>
            {bio.length}/160
          </span>
        </div>
        <textarea
          name="bio"
          value={bio}
          onChange={e => setBio(e.target.value.slice(0, 160))}
          placeholder="High-ticket closer. Remote. Always dialing."
          rows={3}
          className={cn(inputClass, "resize-none mt-1.5")}
        />
      </div>

      {/* Leaderboard opt-in */}
      <div
        className="animate-in bg-[#111318] border border-[#1e2130] rounded-xl p-6"
        style={{ animationDelay: "320ms" }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f0f2f8]">Show me on the leaderboard</p>
              <p className="text-xs text-[#6b7280] mt-0.5 leading-relaxed">
                Appear on the public ApexCard leaderboard ranked by cash collected. Off by default.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={leaderboardOptIn}
            onClick={() => setLeaderboardOptIn(v => !v)}
            className={cn(
              "relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#111318]",
              leaderboardOptIn ? "bg-indigo-500" : "bg-[#1e2130]"
            )}
          >
            <span className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
              leaderboardOptIn ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
          <input type="hidden" name="leaderboard_opt_in" value={leaderboardOptIn ? "on" : "off"} />
        </div>
      </div>

      {/* Feedback */}
      {state?.error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-400">{state.error}</p>
        </div>
      )}
      {state?.success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400">Profile saved.</p>
        </div>
      )}

      <div className="flex justify-end pb-8">
        <Button type="submit" loading={isPending}>Save Profile</Button>
      </div>
    </form>
  );
}
