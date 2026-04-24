import { exitSBOAdminMode } from "@/app/owner/actions";
import { Briefcase, X } from "lucide-react";

export default function SBOAdminBanner() {
  return (
    <div className="sticky top-0 z-50 bg-cyan-500/10 border-b border-cyan-500/25 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Briefcase className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold text-cyan-300 truncate">
            Viewing as{" "}
            <span className="text-cyan-200">SetByOffers Admin</span>
            <span className="ml-2 text-[10px] font-normal text-cyan-400/60">— demo only, no database changes</span>
          </span>
        </div>
        <form action={exitSBOAdminMode}>
          <button
            type="submit"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#6b7280] hover:text-[#9ca3af] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg px-2.5 py-1 transition-colors shrink-0"
          >
            <X className="w-3 h-3" /> Exit
          </button>
        </form>
      </div>
    </div>
  );
}
