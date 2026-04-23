import { getTeamContentPosts, getWeeklyBookedCalls } from "@/lib/crm-queries";
import ContentLogFormClient from "./ContentLogFormClient";
import ContentTable from "./ContentTable";
import ContentDashboard from "./ContentDashboard";

interface Props {
  teamId: string;
  userId: string;
  subtab: "log" | "table" | "dashboard";
  base: string;
}

export default async function ContentTab({ teamId, userId, subtab, base }: Props) {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const fromDate = ninetyDaysAgo.toISOString().split("T")[0];

  const [posts, weeklyBookings] = await Promise.all([
    getTeamContentPosts(teamId),
    getWeeklyBookedCalls(teamId, fromDate),
  ]);

  const subtabLinks: { key: "log" | "table" | "dashboard"; label: string }[] = [
    { key: "log",       label: "Log Post"   },
    { key: "table",     label: "All Posts"  },
    { key: "dashboard", label: "Analytics"  },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab bar */}
      <div className="flex gap-1 bg-[#0d0f15] border border-[#1e2130] rounded-xl p-1 w-fit">
        {subtabLinks.map(({ key, label }) => (
          <a
            key={key}
            href={`${base}?tab=content&subtab=${key}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subtab === key
                ? "bg-white/[0.07] text-white"
                : "text-[#4b5563] hover:text-[#9ca3af]"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      {subtab === "log" && (
        <ContentLogFormClient teamId={teamId} />
      )}

      {subtab === "table" && (
        <ContentTable posts={posts} />
      )}

      {subtab === "dashboard" && (
        <ContentDashboard posts={posts} weeklyBookings={weeklyBookings} />
      )}
    </div>
  );
}
