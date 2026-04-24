import { getImprovementMetrics, getRecentFocusAreas, getCallObjectionsByMonth } from "@/lib/call-analysis-queries";
import ImprovementDashboard from "./ImprovementDashboard";

export default async function ImprovementTab({ userId }: { userId: string }) {
  const [metrics, focusAreas, objections] = await Promise.all([
    getImprovementMetrics(userId),
    getRecentFocusAreas(userId),
    getCallObjectionsByMonth(userId),
  ]);

  return (
    <ImprovementDashboard
      metrics={metrics}
      focusAreas={focusAreas}
      objections={objections}
    />
  );
}
