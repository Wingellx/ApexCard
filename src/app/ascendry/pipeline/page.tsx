import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAscendryUser, getClients } from "@/lib/ascendry-queries";
import KanbanBoard from "@/components/ascendry/KanbanBoard";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const ascendryUser = await getAscendryUser(user.id);
  if (!ascendryUser) redirect("/ascendry");

  const clients = await getClients();

  return (
    <div className="pt-14 lg:pt-0 px-4 lg:px-8 py-8">
      <KanbanBoard clients={clients} isAdmin={ascendryUser.role === "admin"} />
    </div>
  );
}
