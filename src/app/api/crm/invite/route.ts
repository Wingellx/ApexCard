import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTeam, getUserTeamRole } from "@/lib/queries";
import { createInviteToken } from "@/lib/crm-queries";
import { buildInviteEmail } from "@/lib/email";
import { sendEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getUserTeamRole(user.id);
    if (role !== "admin") {
      return NextResponse.json({ error: "Only team managers can generate invite tokens." }, { status: 403 });
    }

    const body: { email?: string; teamId?: string } = await request.json().catch(() => ({}));
    const inviteeEmail = typeof body.email === "string" && body.email.includes("@") ? body.email.trim() : null;

    let teamId: string;
    let teamName: string;

    if (body.teamId) {
      // Verify the user manages this specific team
      const admin = createAdminClient();
      const [memberRes, managerRes] = await Promise.all([
        admin.from("team_members").select("team_id").eq("user_id", user.id).eq("team_id", body.teamId).eq("role", "admin").maybeSingle(),
        admin.from("team_managers").select("team_id").eq("user_id", user.id).eq("team_id", body.teamId).maybeSingle(),
      ]);
      if (!memberRes.data && !managerRes.data) {
        return NextResponse.json({ error: "You do not manage this team." }, { status: 403 });
      }
      const { data: teamRow } = await admin.from("teams").select("name").eq("id", body.teamId).maybeSingle();
      if (!teamRow) return NextResponse.json({ error: "Team not found." }, { status: 404 });
      teamId   = body.teamId;
      teamName = teamRow.name as string;
    } else {
      const userTeam = await getUserTeam(user.id);
      if (!userTeam) return NextResponse.json({ error: "Could not find your team." }, { status: 403 });
      teamId   = userTeam.teamId;
      teamName = userTeam.team.name;
    }

    const { token, expires_at } = await createInviteToken(teamId, user.id);
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.apexcard.app";
    const joinUrl = `${appUrl}/join/crm/${token}`;

    if (inviteeEmail) {
      const { subject, html } = buildInviteEmail({ teamName, shortCode: token, joinUrl, expiresAt: expires_at });
      await sendEmail({ to: inviteeEmail, subject, html }).catch(err => {
        console.error("[crm/invite] email failed:", err);
      });
    }

    return NextResponse.json({ token, expires_at, link: joinUrl });
  } catch (err) {
    console.error("[crm/invite POST]", err);
    return NextResponse.json({ error: "Failed to generate invite token." }, { status: 500 });
  }
}
