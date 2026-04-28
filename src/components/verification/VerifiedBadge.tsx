"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";

interface Props {
  verificationActive: boolean;
  verifiedAt: string | null;
  verifiedByName: string | null;
  size?: "sm" | "md";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function VerifiedBadge({ verificationActive, verifiedAt, verifiedByName, size = "md" }: Props) {
  const [open, setOpen] = useState(false);

  const iconCls = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const active  = verificationActive;

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="focus:outline-none"
        aria-label={active ? "Verified" : "Verification paused"}
      >
        {active ? (
          <ShieldCheck className={`${iconCls} text-emerald-400`} />
        ) : (
          <ShieldOff className={`${iconCls} text-[#4b5563]`} />
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-max max-w-[220px]">
          <div className="bg-[#1a1d28] border border-[#2a2f45] rounded-xl px-3 py-2.5 shadow-xl text-xs text-center">
            {active ? (
              <>
                <p className="font-semibold text-emerald-400 mb-0.5">Verified</p>
                {verifiedByName && (
                  <p className="text-[#9ca3af]">by {verifiedByName}</p>
                )}
                {verifiedAt && (
                  <p className="text-[#6b7280] mt-0.5">{fmtDate(verifiedAt)}</p>
                )}
              </>
            ) : (
              <>
                <p className="font-semibold text-[#6b7280] mb-0.5">Verification paused</p>
                <p className="text-[#4b5563]">Resume logging to reactivate.</p>
              </>
            )}
          </div>
          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-[#1a1d28] border-b border-r border-[#2a2f45] rotate-45 -mt-1" />
          </div>
        </div>
      )}
    </div>
  );
}
