"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

export default function JoinCRMButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/invite/${token}/redeem`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      if (data.role === "offer_owner" && data.teamId) {
        router.push(`/dashboard/crm/manager/${data.teamId}?tab=content`);
      } else {
        router.push("/dashboard/crm");
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}
      <button
        onClick={handleJoin}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 w-full text-sm font-semibold px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shadow-lg shadow-indigo-500/20"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
        ) : (
          <>Join team <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}
