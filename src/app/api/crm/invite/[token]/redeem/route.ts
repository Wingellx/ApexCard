import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redeemInviteToken } from "@/lib/crm-queries";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId, role } = await redeemInviteToken(token, user.id);

    return NextResponse.json({ success: true, teamId, role });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to redeem invite.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
