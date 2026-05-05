import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { echelonFollowUpReminder } from "@/lib/email";

// TODO: Set ECHELON_TEAM_ID env var to the actual Echelon team UUID
const ECHELON_TEAM_ID = process.env.ECHELON_TEAM_ID ?? "";

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!ECHELON_TEAM_ID) {
    return NextResponse.json({ error: "ECHELON_TEAM_ID env var not set" }, { status: 500 });
  }

  const admin = createAdminClient();

  // Only managers may trigger
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("team_id", ECHELON_TEAM_ID)
    .maybeSingle();

  if (!membership || !["admin", "offer_owner"].includes(membership.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: apps, error: appsErr } = await admin
    .from("echelon_applications")
    .select("id, user_id, company_name, follow_up_date, profiles(full_name, email)")
    .eq("team_id", ECHELON_TEAM_ID)
    .eq("follow_up_date", today)
    .eq("follow_up_done", false);

  if (appsErr) return NextResponse.json({ error: appsErr.message }, { status: 500 });

  const sent: string[] = [];
  const errors: string[] = [];

  await Promise.all(
    (apps ?? []).map(async (app) => {
      type P = { full_name?: string | null; email?: string | null };
      const profile = app.profiles as P | null;
      const to = profile?.email;
      if (!to) return;

      try {
        const template = echelonFollowUpReminder({
          name:         profile?.full_name ?? "there",
          companyName:  app.company_name as string,
          followUpDate: app.follow_up_date as string,
        });
        await sendEmail({ to, subject: template.subject, html: template.html });
        sent.push(to);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "unknown";
        errors.push(`${to}: ${msg}`);
      }
    })
  );

  return NextResponse.json({ sent, errors, total: apps?.length ?? 0 });
}
