import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTeam, getUserTeamRole } from "@/lib/queries";
import { createInviteToken } from "@/lib/crm-queries";
import { buildInviteEmail } from "@/lib/email";
import { sendEmail } from "@/lib/resend";

export async function POST(request: Request) {
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

    // Optional: invitee email to send the invite directly
    let inviteeEmail: string | null = null;
    try {
      const body = await request.json().catch(() => ({}));
      inviteeEmail = typeof body?.email === "string" && body.email.includes("@") ? body.email.trim() : null;
    } catch { /* body may be empty */ }

    const { token, expires_at } = await createInviteToken(userTeam.teamId, user.id);
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://apexcard.app";
    const joinUrl = `${appUrl}/join/crm/${token}`;

    if (inviteeEmail) {
      const { subject, html } = buildInviteEmail({
        teamName:  userTeam.team.name,
        shortCode: token,
        joinUrl,
        expiresAt: expires_at,
      });
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
