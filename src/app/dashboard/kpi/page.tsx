import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserCustomFeature } from "@/lib/queries";
import KPIDashboard from "./KPIDashboard";

export default async function KPIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const hasFeature = await getUserCustomFeature(user.id, "closing_kpi_dashboard");
  if (!hasFeature) redirect("/dashboard");

  const year = new Date().getFullYear();

  const [{ data: entries }, { data: sheetConn }] = await Promise.all([
    supabase
      .from("closing_kpi_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("year", year)
      .order("month"),
    supabase
      .from("google_sheet_connections")
      .select("sheet_id, sheet_name, token_expiry")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <div className="px-4 sm:px-6 py-6 max-w-full">
      <KPIDashboard
        year={year}
        initialEntries={entries ?? []}
        initialConnection={sheetConn ? {
          sheet_id: sheetConn.sheet_id,
          sheet_name: sheetConn.sheet_name,
          connected: true,
        } : null}
      />
    </div>
  );
}
