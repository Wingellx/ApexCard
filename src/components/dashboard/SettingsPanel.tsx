"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { updateName, updateEmail, updatePassword, deleteAccount } from "@/app/dashboard/settings/actions";

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#4b5563] focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40 transition-colors";
const labelClass =
  "block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5";
const btnClass =
  "inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors";

function StatusMessage({ state }: { state: { error?: string; success?: boolean } | null }) {
  if (!state) return null;
  if (state.success) {
    return (
      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mt-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-sm text-emerald-400">Saved successfully.</p>
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mt-3">
        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
        <p className="text-sm text-rose-400">{state.error}</p>
      </div>
    );
  }
  return null;
}

function NameForm({ currentName }: { currentName: string }) {
  const [state, formAction, isPending] = useActionState(updateName, null);
  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className={labelClass}>Full name</label>
        <input
          name="full_name"
          type="text"
          defaultValue={currentName}
          placeholder="Alex Johnson"
          required
          className={inputClass}
        />
      </div>
      <StatusMessage state={state} />
      <button type="submit" disabled={isPending} className={btnClass}>
        {isPending ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}

function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, isPending] = useActionState(updateEmail, null);
  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className={labelClass}>Email address</label>
        <input
          name="email"
          type="email"
          defaultValue={currentEmail}
          placeholder="you@example.com"
          required
          className={inputClass}
        />
      </div>
      {state?.success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400">Check your new email to confirm the change.</p>
        </div>
      )}
      {state?.error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-400">{state.error}</p>
        </div>
      )}
      <button type="submit" disabled={isPending} className={btnClass}>
        {isPending ? "Saving…" : "Update email"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, null);
  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className={labelClass}>New password</label>
        <input
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Confirm password</label>
        <input
          name="confirm_pass"
          type="password"
          placeholder="Repeat new password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <StatusMessage state={state} />
      <button type="submit" disabled={isPending} className={btnClass}>
        {isPending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}

function DeleteForm() {
  const [state, formAction, isPending] = useActionState(deleteAccount, null);
  const [confirmed, setConfirmed] = useState("");

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex gap-3 p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-sm text-[#9ca3af] leading-relaxed">
          <p className="text-rose-400 font-semibold mb-1">This action is permanent and cannot be undone.</p>
          <p>All your call logs, goals, and profile data will be deleted immediately. Your public stats card will stop working.</p>
        </div>
      </div>
      <div>
        <label className={labelClass}>
          Type <span className="text-rose-400 normal-case font-mono font-bold">DELETE</span> to confirm
        </label>
        <input
          name="confirmation"
          type="text"
          value={confirmed}
          onChange={(e) => setConfirmed(e.target.value)}
          placeholder="DELETE"
          className={`${inputClass} border-rose-500/30 focus:border-rose-500/60 focus:ring-rose-500/40`}
          autoComplete="off"
        />
      </div>
      {state?.error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-400">{state.error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={isPending || confirmed !== "DELETE"}
        className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        {isPending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}

interface Props {
  fullName:  string;
  email:     string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-5">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPanel({ fullName, email }: Props) {
  return (
    <div className="space-y-5">
      <Section title="Account">
        <div className="space-y-6">
          <NameForm currentName={fullName} />
          <div className="border-t border-white/[0.06]" />
          <EmailForm currentEmail={email} />
          <div className="border-t border-white/[0.06]" />
          <PasswordForm />
        </div>
      </Section>

      <Section title="Danger Zone">
        <DeleteForm />
      </Section>
    </div>
  );
}
