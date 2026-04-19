import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-[#1e2130] rounded-lg", className)} />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#1e2130]">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === 0 ? "w-28" : "w-16"} flex-shrink-0`} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1200px] space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111318] border border-[#1e2130] rounded-xl p-6 h-48">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-full w-full" />
        </div>
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6 h-48">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px] space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
      <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6 space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[800px] space-y-4">
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-[#111318] border border-[#1e2130] rounded-xl p-5 flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}
