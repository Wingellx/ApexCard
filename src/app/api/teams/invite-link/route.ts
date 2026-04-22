import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInviteToken } from "@/lib/crm-queries";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.log("[invite-link] user:", user.id);

    const admin = createAdminClient();
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("account_type, verified_owner")
      .eq("id", user.id)
      .maybeSingle();
    console.log("[invite-link] profile:", JSON.stringify(profile), "err:", JSON.stringify(profileErr));

    if (profile?.account_type !== "owner" || !profile?.verified_owner) {
      return NextResponse.json({ error: `Owner access required. Got account_type=${profile?.account_type} verified=${profile?.verified_owner}` }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { teamId } = body as { teamId?: string };
    console.log("[invite-link] teamId:", teamId);
    if (!teamId) return NextResponse.json({ error: "teamId required." }, { status: 400 });

    const { data: team, error: teamErr } = await admin.from("teams").select("id").eq("id", teamId).maybeSingle();
    console.log("[invite-link] team:", JSON.stringify(team), "err:", JSON.stringify(teamErr));
    if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

    const { token, expires_at } = await createInviteToken(teamId, user.id);
    console.log("[invite-link] token created:", token);

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.apexcard.app")
      .replace(/^(https?:\/\/)(?!www\.)/, "$1www.");
    const link = `${appUrl}/join/crm/${token}`;

    return NextResponse.json({ link, expires_at });
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("[invite-link] caught:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
