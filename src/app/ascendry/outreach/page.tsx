import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAscendryUser, getProspects, getTemplates } from "@/lib/ascendry-queries";
import OutreachTracker from "@/components/ascendry/OutreachTracker";

export default async function OutreachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const ascendryUser = await getAscendryUser(user.id);
  if (!ascendryUser || ascendryUser.role !== "admin") redirect("/ascendry");

  const [prospects, templates] = await Promise.all([getProspects(), getTemplates()]);

  return (
    <div className="pt-14 lg:pt-0 px-4 lg:px-8 py-8">
      <OutreachTracker prospects={prospects} templates={templates} />
    </div>
  );
}
