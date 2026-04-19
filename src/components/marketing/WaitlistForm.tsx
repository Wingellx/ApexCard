"use client";

import { useActionState, useRef, useEffect } from "react";
import { joinWaitlist } from "@/app/actions/waitlist";
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  initialCount: number;
}

export default function WaitlistForm({ initialCount }: Props) {
  const [state, formAction, isPending] = useActionState(joinWaitlist, null);
  const inputRef = useRef<HTMLInputElement>(null);

  const count    = state && "count"  in state ? state.count  : initialCount;
  const hasError = state && "error"  in state;
  const success  = state && "success" in state && state.success;
  const alreadyJoined = success && "alreadyJoined" in state && state.alreadyJoined;

  useEffect(() => {
    if (hasError && inputRef.current) inputRef.current.focus();
  }, [hasError]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {success ? (
        <div className="animate-in">
          <div className="flex flex-col items-center gap-3 py-6 px-8 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl text-center">
            <div className="w-12 h-12 bg-indigo-500/15 border border-indigo-500/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold text-[#f0f2f8] text-base">
                {alreadyJoined ? "You're already on the list." : "You're on the list."}
              </p>
              <p className="text-sm text-[#6b7280] mt-1">
                We&apos;ll notify you the moment we launch.
              </p>
            </div>
          </div>
          <p className="text-center text-xs text-[#4b5563] mt-4">
            <span className="text-indigo-400 font-semibold">{count.toLocaleString()}</span>
            {" "}people are waiting
          </p>
        </div>
      ) : (
        <>
          <form action={formAction}>
            <div className={cn(
              "flex items-center gap-0 bg-[#0d0f15] rounded-xl overflow-hidden border transition-colors",
              hasError ? "border-rose-500/50" : "border-[#1e2130] focus-within:border-indigo-500/60"
            )}>
              <div className="flex items-center gap-2.5 px-4 shrink-0">
                <Mail className="w-4 h-4 text-[#4b5563]" />
              </div>
              <input
                ref={inputRef}
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                autoComplete="email"
                className="flex-1 bg-transparent py-4 text-sm text-[#f0f2f8] placeholder-[#4b5563] focus:outline-none min-w-0"
              />
              <button
                type="submit"
                disabled={isPending}
                className="shrink-0 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-4 transition-colors"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Join <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {hasError && (
              <p className="text-xs text-rose-400 mt-2 px-1">{(state as { error: string }).error}</p>
            )}
          </form>

          <p className="text-center text-xs text-[#4b5563]">
            <span className="text-[#6b7280] font-semibold">{count.toLocaleString()}</span>
            {" "}people already on the waitlist · No spam, ever
          </p>
        </>
      )}
    </div>
  );
}
