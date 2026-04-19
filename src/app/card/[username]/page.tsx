import { notFound } from "next/navigation";
import { getUserIdByUsername, getPublicLifetimeStats, getUserMonthlyLeaderboardRank } from "@/lib/queries";
import PublicStatsCard from "@/components/public/PublicStatsCard";

export default async function CardPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const userId = await getUserIdByUsername(username);
  if (!userId) notFound();

  const [stats, monthlyRank] = await Promise.all([
    getPublicLifetimeStats(userId),
    getUserMonthlyLeaderboardRank(userId),
  ]);
  if (!stats) notFound();

  return <PublicStatsCard {...stats} monthlyRank={monthlyRank} />;
}
