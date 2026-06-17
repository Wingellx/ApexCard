import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAscendryUser, getClients, getClientMetrics, getAscendryUsers } from "@/lib/ascendry-queries";
import ClientMetricsDashboard from "@/components/ascendry/ClientMetricsDashboard";

export default async function MetricsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const ascendryUser = await getAscendryUser(user.id);
  if (!ascendryUser) redirect("/ascendry");

  const [clients, metrics, ascendryUsers] = await Promise.all([
    getClients(),
    getClientMetrics(),
    getAscendryUsers(),
  ]);

  const activeClients = clients.filter(c => c.stage === "Active Client" || c.stage === "60-Day Review");

  return (
    <div className="pt-14 lg:pt-0 px-4 lg:px-8 py-8">
      <ClientMetricsDashboard
        clients={activeClients}
        allMetrics={metrics}
        isAdmin={ascendryUser.role === "admin"}
        currentUserId={user.id}
        ascendryUsers={ascendryUsers}
      />
    </div>
  );
}
