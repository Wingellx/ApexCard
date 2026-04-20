"use client";

import { useTransition } from "react";
import { Star } from "lucide-react";
import { toggleShortlist } from "./actions";
import { cn } from "@/lib/utils";

export default function ShortlistButton({ repId, isShortlisted }: { repId: string; isShortlisted: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => { await toggleShortlist(repId); });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
      className={cn(
        "p-2 rounded-lg transition-all duration-150 shrink-0",
        isShortlisted
          ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
          : "text-[#2d3147] hover:text-amber-400 hover:bg-amber-500/[0.07]",
        isPending && "opacity-50"
      )}
    >
      <Star className={cn("w-4 h-4", isShortlisted && "fill-amber-400")} />
    </button>
  );
}
