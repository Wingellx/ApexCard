"use client";

import { useState } from "react";
import { ShieldCheck, Clock, ShieldOff } from "lucide-react";
import type { ApprovedManager } from "@/lib/verification-queries";
import RequestVerificationModal from "./RequestVerificationModal";
import VerifiedBadge from "./VerifiedBadge";

interface Props {
  isVerified: boolean;
  verificationActive: boolean;
  verifiedAt: string | null;
  verifiedByName: string | null;
  pendingRequestExists: boolean;
  managers: ApprovedManager[];
}

export default function VerificationSection({
  isVerified,
  verificationActive,
  verifiedAt,
  verifiedByName,
  pendingRequestExists,
  managers,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (isVerified) {
    return (
      <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-5 flex items-center gap-4">
        <VerifiedBadge
          verificationActive={verificationActive}
          verifiedAt={verifiedAt}
          verifiedByName={verifiedByName}
          size="md"
        />
        <div>
          <p className="text-sm font-bold text-[#f0f2f8]">
            {verificationActive ? "Verified" : "Verification Paused"}
          </p>
          <p className="text-xs text-[#6b7280] mt-0.5">
            {verificationActive
              ? `Verified by ${verifiedByName ?? "ApexCard"}${verifiedAt ? ` · ${new Date(verifiedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : ""}`
              : "Log today to reactivate your verified badge."}
          </p>
        </div>
        {!verificationActive && (
          <ShieldOff className="w-4 h-4 text-[#374151] shrink-0 ml-auto" />
        )}
      </div>
    );
  }

  if (submitted || pendingRequestExists) {
    return (
      <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-5 flex items-center gap-4">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#f0f2f8]">Verification Pending</p>
          <p className="text-xs text-[#6b7280] mt-0.5">
            Your request is awaiting review. You&apos;ll receive an email once it&apos;s been decided.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#f0f2f8]">Get Verified</p>
            <p className="text-xs text-[#6b7280] mt-0.5 max-w-sm">
              Have a manager verify your stats. A green verified badge appears on your public card.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Request Verification
        </button>
      </div>

      {modalOpen && (
        <RequestVerificationModal
          managers={managers}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            setSubmitted(true);
          }}
        />
      )}
    </>
  );
}
