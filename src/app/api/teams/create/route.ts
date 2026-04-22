import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildTeamApprovalEmail } from "@/lib/email";
import { sendEmail } from "@/lib/resend";

const OWNER_EMAIL = "wingell@apexcard.app";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "Team name is required." }, { status: 400 });

    const admin = createAdminClient();

    // Must be an admin of a team to create sub-teams
    const { data: membership } = await admin
      .from("team_members")
      .select("team_id, teams(id, name)")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: "Only team managers can create sub-teams." }, { status: 403 });

    const parentTeam = membership.teams as unknown as { id: string; name: string };

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const managerName = profile?.full_name?.trim() || profile?.email?.split("@")[0] || "Your manager";

    // Create team as pending
    const { data: team, error: teamError } = await admin
      .from("teams")
      .insert({
        name:           name.trim(),
        invite_code:    `${name.trim().toUpperCase().replace(/\s+/g, "-").slice(0, 12)}-${Date.now().toString(36).toUpperCase().slice(-4)}`,
        parent_team_id: parentTeam.id,
        created_by:     user.id,
        status:         "pending",
      })
      .select("id, approve_token, decline_token")
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: teamError?.message ?? "Failed to create team." }, { status: 500 });
    }

    // Register manager in team_managers
    await admin.from("team_managers").insert({ user_id: user.id, team_id: team.id });

    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.apexcard.app";
    const approveUrl = `${appUrl}/api/teams/approve/${team.approve_token}`;
    const declineUrl = `${appUrl}/api/teams/decline/${team.decline_token}`;

    const { subject, html } = buildTeamApprovalEmail({
      managerName,
      teamName:       name.trim(),
      parentTeamName: parentTeam.name,
      approveUrl,
      declineUrl,
    });

    try {
      await sendEmail({ to: OWNER_EMAIL, subject, html });
    } catch {
      await admin.from("teams").delete().eq("id", team.id);
      return NextResponse.json({ error: "Failed to send approval email." }, { status: 500 });
    }

    return NextResponse.json({ success: true, teamId: team.id });
  } catch (err) {
    console.error("[teams/create]", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
