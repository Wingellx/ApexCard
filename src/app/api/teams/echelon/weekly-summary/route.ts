import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { echelonWeeklySummary } from "@/lib/email";
import { calculateEchelonScore } from "@/lib/scoring/echelonScore";
import { getTeamScores } from "@/lib/echelon-queries";

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

  const { data: members, error: membersErr } = await admin
    .from("team_members")
    .select("user_id, phase, profiles(full_name, email)")
    .eq("team_id", ECHELON_TEAM_ID);

  if (membersErr) return NextResponse.json({ error: membersErr.message }, { status: 500 });

  // Compute all scores to determine rank
  const scores = await getTeamScores(ECHELON_TEAM_ID);
  const sortedUserIds = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0]);

  const totalMembers = (members ?? []).length;
  const sent: string[] = [];
  const errors: string[] = [];

  await Promise.all(
    (members ?? []).map(async (m) => {
      type P = { full_name?: string | null; email?: string | null };
      const profile = m.profiles as P | null;
      const email = profile?.email;
      if (!email) return;

      let score = scores.get(m.user_id as string);
      if (score === undefined) {
        const breakdown = await calculateEchelonScore(m.user_id as string, ECHELON_TEAM_ID);
        score = breakdown.total;
      }

      const rank = sortedUserIds.indexOf(m.user_id as string) + 1 || totalMembers;

      // Generic improvement notes per phase
      const phaseNotes: Record<string, { improvement: string; action: string }> = {
        learning: {
          improvement: "Focus on completing your course material and attending group calls consistently.",
          action:      "Attend your next scheduled coaching call and review this week's course content.",
        },
        outreach: {
          improvement: "Consistency in daily outreach is the key driver of your score in this phase.",
          action:      "Log at least 10 new outreach contacts today and follow up on any pending applications.",
        },
        on_offer: {
          improvement: "Your booking rate is the highest-weighted metric — keep your pipeline active.",
          action:      "Aim to complete at least 20 calls this week and log each in your CRM.",
        },
      };

      const notes = phaseNotes[(m.phase as string) ?? "learning"] ?? phaseNotes.learning;

      try {
        const template = echelonWeeklySummary({
          name:            profile?.full_name ?? "there",
          score,
          rank,
          totalMembers,
          phase:           (m.phase as string) ?? "learning",
          improvementNote: notes.improvement,
          actionItem:      notes.action,
        });
        await sendEmail({ to: email, subject: template.subject, html: template.html });
        sent.push(email);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "unknown";
        errors.push(`${email}: ${msg}`);
      }
    })
  );

  return NextResponse.json({ sent, errors });
}
