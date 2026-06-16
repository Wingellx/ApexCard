import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAscendryUser, getProspects } from "@/lib/ascendry-queries";
import WeeklyAnalysis from "@/components/ascendry/WeeklyAnalysis";

export default async function AnalysisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const ascendryUser = await getAscendryUser(user.id);
  if (!ascendryUser || ascendryUser.role !== "admin") redirect("/ascendry");

  const prospects = await getProspects();

  return (
    <div className="pt-14 lg:pt-0 px-4 lg:px-8 py-8">
      <WeeklyAnalysis prospects={prospects} />
    </div>
  );
}
