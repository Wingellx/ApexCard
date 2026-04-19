import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const admin = createAdminClient();
  const { data: req } = await admin
    .from("verification_requests")
    .select("id, status")
    .eq("decline_token", token)
    .maybeSingle();

  if (!req) {
    return NextResponse.redirect(`${appUrl}/verify/invalid`);
  }
  if (req.status !== "pending") {
    return NextResponse.redirect(`${appUrl}/verify/${token}?status=${req.status}`);
  }

  await admin
    .from("verification_requests")
    .update({ status: "rejected" })
    .eq("id", req.id);

  return NextResponse.redirect(`${appUrl}/verify/declined`);
}
