import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { declineRepVerification } from "@/lib/verification-queries";
import { sendEmail } from "@/lib/resend";
import { buildVerificationDeclinedEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://apexcard.app";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const admin = createAdminClient();

  const { data: req } = await admin
    .from("rep_verification_requests")
    .select("id, user_id, requested_from, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!req) return NextResponse.redirect(`${APP_URL}/verify/invalid`);
  if (req.status !== "pending") {
    return NextResponse.redirect(`${APP_URL}/verify/declined?already=1`);
  }

  const result = await declineRepVerification(requestId, req.requested_from);
  if (result.error) return NextResponse.redirect(`${APP_URL}/verify/invalid`);

  // Email the rep
  const { data: repProfile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", req.user_id)
    .maybeSingle();

  if (repProfile?.email) {
    const repName = repProfile.full_name?.trim() || repProfile.email.split("@")[0];
    try {
      const { subject, html } = buildVerificationDeclinedEmail({ repName });
      await sendEmail({ to: repProfile.email, subject, html });
    } catch { /* non-fatal */ }
  }

  return NextResponse.redirect(`${APP_URL}/verify/declined`);
}
