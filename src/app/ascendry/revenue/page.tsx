import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAscendryUser, getPayments } from "@/lib/ascendry-queries";
import RevenueTracker from "@/components/ascendry/RevenueTracker";

export default async function RevenuePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const ascendryUser = await getAscendryUser(user.id);
  if (!ascendryUser || ascendryUser.role !== "admin") redirect("/ascendry");

  const payments = await getPayments();

  return (
    <div className="pt-14 lg:pt-0 px-4 lg:px-8 py-8">
      <RevenueTracker payments={payments} />
    </div>
  );
}
