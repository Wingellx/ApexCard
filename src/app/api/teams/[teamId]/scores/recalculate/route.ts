import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalculateTeamScores } from "@/lib/scoring/echelonScore";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { teamId } = await params;
  const admin = createAdminClient();

  // Only managers may trigger recalculation
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || !["admin", "offer_owner"].includes(membership.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await recalculateTeamScores(teamId);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[recalculate] error for teamId=%s:", teamId, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
