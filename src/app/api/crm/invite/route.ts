import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTeam, getUserTeamRole } from "@/lib/queries";
import { createInviteToken } from "@/lib/crm-queries";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [role, userTeam] = await Promise.all([
      getUserTeamRole(user.id),
      getUserTeam(user.id),
    ]);

    if (role !== "admin" || !userTeam) {
      return NextResponse.json({ error: "Only team managers can generate invite tokens." }, { status: 403 });
    }

    const { token, expires_at } = await createInviteToken(userTeam.teamId, user.id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.json({
      token,
      expires_at,
      link: `${appUrl}/join/crm/${token}`,
    });
  } catch (err) {
    console.error("[crm/invite POST]", err);
    return NextResponse.json({ error: "Failed to generate invite token." }, { status: 500 });
  }
}
