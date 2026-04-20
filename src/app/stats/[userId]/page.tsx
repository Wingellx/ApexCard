import { notFound, redirect } from "next/navigation";
import { getPublicLifetimeStats, getUserMonthlyLeaderboardRank, getVerifiedPeriodStats } from "@/lib/queries";
import PublicStatsCard from "@/components/public/PublicStatsCard";

export default async function LegacyStatsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const stats = await getPublicLifetimeStats(userId);
  if (!stats) notFound();

  if (stats.username) {
    redirect(`/card/${stats.username}`);
  }

  const [monthlyRank, verifiedPeriod] = await Promise.all([
    getUserMonthlyLeaderboardRank(userId),
    getVerifiedPeriodStats(userId),
  ]);

  return <PublicStatsCard {...stats} monthlyRank={monthlyRank} verifiedPeriod={verifiedPeriod} />;
}
