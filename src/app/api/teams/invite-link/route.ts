import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInviteToken } from "@/lib/crm-queries";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("account_type, verified_owner")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.account_type !== "owner" || !profile?.verified_owner) {
      return NextResponse.json({ error: "Owner access required." }, { status: 403 });
    }

    const { teamId } = await request.json();
    if (!teamId) return NextResponse.json({ error: "teamId required." }, { status: 400 });

    const { data: team } = await admin.from("teams").select("id").eq("id", teamId).maybeSingle();
    if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

    const { token, expires_at } = await createInviteToken(teamId, user.id);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.apexcard.app")
      .replace(/^(https?:\/\/)(?!www\.)/, "$1www.");
    const link = `${appUrl}/join/crm/${token}`;

    return NextResponse.json({ link, expires_at });
  } catch (err) {
    console.error("[teams/invite-link]", err);
    return NextResponse.json({ error: "Failed to generate invite link." }, { status: 500 });
  }
}
