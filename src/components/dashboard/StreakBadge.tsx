import { cn } from "@/lib/utils";

interface Props {
  streak: number;
}

export default function StreakBadge({ streak }: Props) {
  if (streak === 0) return null;

  const color =
    streak >= 14 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    streak >= 7  ? "text-amber-400  bg-amber-500/10  border-amber-500/20"  :
                   "text-orange-400 bg-orange-500/10 border-orange-500/20";

  return (
    <div className={cn("inline-flex items-center gap-1.5 border rounded-full px-3 py-1", color)}>
      <span className="text-base leading-none">🔥</span>
      <span className="text-xs font-bold tabular-nums">{streak}</span>
      <span className="text-xs font-medium">{streak === 1 ? "day" : "day"} streak</span>
    </div>
  );
}
