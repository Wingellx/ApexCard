"use client";

import { useState } from "react";
import { ExternalLink, Copy, Check, Pencil, ShieldCheck, Trophy } from "lucide-react";
import ProfileForm from "@/components/dashboard/ProfileForm";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  closer:   { label: "Closer",             color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"  },
  setter:   { label: "Appointment Setter", color: "text-amber-400  bg-amber-500/10  border-amber-500/20"  },
  operator: { label: "Growth Operator",    color: "text-cyan-400   bg-cyan-500/10   border-cyan-500/20"   },
  manager:  { label: "Sales Manager",      color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
};

interface Profile {
  full_name: string | null;
  email: string;
  username: string | null;
  role: string;
  bio: string;
  leaderboard_opt_in: boolean;
  discoverable: boolean;
  contact_enabled: boolean;
}

interface Props {
  profile: Profile | null;
  appUrl: string;
}

function isSetUp(p: Profile | null): boolean {
  return !!(p?.full_name?.trim() || p?.username);
}

function initials(name: string | null, email: string): string {
  if (name?.trim()) {
    return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }
  return email[0].toUpperCase();
}

function displayName(p: Profile): string {
  return p.full_name?.trim() || p.email.split("@")[0];
}

function ProfileView({ profile, appUrl, onEdit }: { profile: Profile; appUrl: string; onEdit: () => void }) {
  const [copied, setCopied] = useState(false);
  const publicUrl = profile.username ? `${appUrl}/card/${profile.username}` : null;
  const role = ROLE_LABELS[profile.role] ?? { label: profile.role, color: "text-[#6b7280] bg-white/5 border-white/10" };
  const ini = initials(profile.full_name, profile.email);
  const name = displayName(profile);

  function copyUrl() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">

      {/* Identity card */}
      <div className="animate-in bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
        <div className="h-[2px] bg-indigo-500 shadow-[0_2px_14px_2px_rgba(99,102,241,0.28)]" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">

            {/* Avatar + name block */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-lg font-black text-white select-none"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.3) 100%)", border: "1px solid rgba(139,92,246,0.2)" }}
              >
                {ini}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#f0f2f8] leading-tight">{name}</h2>
                {profile.username && (
                  <p className="text-sm text-[#4b5563] font-medium mt-0.5">@{profile.username}</p>
                )}
                <div className="mt-2">
                  <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${role.color}`}>
                    {role.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] hover:text-[#f0f2f8] border border-[#1e2130] hover:border-[#2a2f45] px-3 py-2 rounded-lg transition-colors shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          </div>

          {/* Bio */}
          {profile.bio?.trim() && (
            <p className="text-sm text-[#9ca3af] mt-5 leading-relaxed border-t border-[#1e2130] pt-5">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Public URL card */}
      <div className="animate-in bg-[#111318] border border-[#1e2130] rounded-xl p-5" style={{ animationDelay: "80ms" }}>
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-3">Public Card URL</p>
        {publicUrl ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-2.5">
              <p className="text-sm text-[#f0f2f8] font-medium truncate">{publicUrl}</p>
            </div>
            <button
              onClick={copyUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] hover:text-[#f0f2f8] border border-[#1e2130] hover:border-[#2a2f45] px-3 py-2.5 rounded-lg transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 px-3 py-2.5 rounded-lg transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 bg-[#0d0f15] border border-dashed border-[#1e2130] rounded-lg px-4 py-3">
            <p className="text-sm text-[#374151]">Set a username to claim your public URL</p>
            <button
              onClick={onEdit}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
            >
              Set username →
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard status */}
      <div className="animate-in bg-[#111318] border border-[#1e2130] rounded-xl p-5 flex items-center justify-between" style={{ animationDelay: "160ms" }}>
        <div className="flex items-center gap-3">
          <Trophy className={`w-4 h-4 ${profile.leaderboard_opt_in ? "text-amber-400" : "text-[#374151]"}`} />
          <div>
            <p className="text-sm font-semibold text-[#f0f2f8]">Leaderboard</p>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {profile.leaderboard_opt_in ? "You appear on the public leaderboard" : "You're hidden from the leaderboard"}
            </p>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
          profile.leaderboard_opt_in
            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
            : "text-[#4b5563] bg-white/5 border-white/5"
        }`}>
          {profile.leaderboard_opt_in ? "Opted in" : "Opted out"}
        </span>
      </div>

    </div>
  );
}

export default function ProfilePanel({ profile, appUrl }: Props) {
  const [editing, setEditing] = useState(!isSetUp(profile));

  if (editing) {
    return (
      <div>
        {isSetUp(profile) && (
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-[#6b7280]">Editing your profile</p>
            <button
              onClick={() => setEditing(false)}
              className="text-xs font-semibold text-[#6b7280] hover:text-[#f0f2f8] transition-colors"
            >
              ← Cancel
            </button>
          </div>
        )}
        <ProfileForm profile={profile} appUrl={appUrl} onSaved={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <ProfileView
      profile={profile!}
      appUrl={appUrl}
      onEdit={() => setEditing(true)}
    />
  );
}
