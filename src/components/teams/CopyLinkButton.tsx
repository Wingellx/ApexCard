"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <input
        readOnly
        value={url}
        className="w-[200px] sm:w-[260px] text-xs bg-[#0a0c12] border border-[#1e2130] rounded-lg px-2.5 py-1.5 text-[#6b7280] focus:outline-none truncate"
      />
      <button
        onClick={handleCopy}
        className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        {copied
          ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
          : <><Copy className="w-3.5 h-3.5" /> Copy</>
        }
      </button>
    </div>
  );
}
