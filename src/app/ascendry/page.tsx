import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAscendryUser } from "@/lib/ascendry-queries";

export default async function AscendryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const ascendryUser = await getAscendryUser(user.id);
  if (!ascendryUser) redirect("/dashboard");

  // Redirect to the first accessible section
  if (ascendryUser.role === "admin") {
    redirect("/ascendry/outreach");
  } else {
    redirect("/ascendry/pipeline");
  }
}
