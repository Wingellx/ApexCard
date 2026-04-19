"use client";

import { useActionState } from "react";
import { submitContactForm } from "@/app/actions/contact";
import Button from "@/components/ui/Button";
import { CheckCircle2, XCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, null);

  if (state?.success) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-6 py-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
        <p className="font-semibold text-[#f0f2f8] mb-1">Message sent!</p>
        <p className="text-sm text-[#6b7280]">We&apos;ll get back to you within 1–2 business days.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
            Name
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="Alex Johnson"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="alex@example.com"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
          Message
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell us what you're working on or how we can help..."
          className={cn(inputClass, "resize-none")}
        />
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-400">{state.error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={isPending}>
          <Send className="w-4 h-4 mr-2" />
          Send message
        </Button>
      </div>
    </form>
  );
}
