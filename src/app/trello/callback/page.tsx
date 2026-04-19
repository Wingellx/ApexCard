"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveTrelloToken } from "@/app/dashboard/io/trello/actions";

export default function TrelloCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "saving" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Trello sends the token in the URL hash fragment: #token=abc123
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No token received from Trello. Please try connecting again.");
      return;
    }

    setStatus("saving");
    saveTrelloToken(token).then((result) => {
      if (result?.error) {
        setStatus("error");
        setMessage(result.error);
      } else {
        router.replace("/dashboard/io?trello=connected");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {status === "loading" && (
          <>
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#6b7280]">Connecting Trello…</p>
          </>
        )}
        {status === "saving" && (
          <>
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#6b7280]">Saving connection…</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-base font-bold text-[#f0f2f8] mb-2">Connection failed</p>
            <p className="text-sm text-[#6b7280] mb-6">{message}</p>
            <button
              onClick={() => router.replace("/dashboard/io")}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              ← Back to IO Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
