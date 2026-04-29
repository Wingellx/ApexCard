import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveRepVerification } from "@/lib/verification-queries";
import { sendEmail } from "@/lib/resend";
import { buildVerificationApprovedEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.apexcard.app";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  const admin = createAdminClient();

  // We don't know who clicked, but email links are unauthenticated (like the old verify flow).
  // We look up the request to find requested_from (the manager), then approve using that ID.
  const { data: req } = await admin
    .from("rep_verification_requests")
    .select("id, user_id, requested_from, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!req) return NextResponse.redirect(`${APP_URL}/verify/invalid`);
  if (req.status !== "pending") {
    return NextResponse.redirect(`${APP_URL}/verify/declined?already=1`);
  }

  const result = await approveRepVerification(requestId, req.requested_from);
  if (result.error) return NextResponse.redirect(`${APP_URL}/verify/invalid`);

  // Email the rep
  const [{ data: repProfile }, { data: reviewerProfile }] = await Promise.all([
    admin.from("profiles").select("full_name, email, username").eq("id", req.user_id).maybeSingle(),
    admin.from("profiles").select("full_name").eq("id", req.requested_from).maybeSingle(),
  ]);

  if (repProfile?.email) {
    const repName      = repProfile.full_name?.trim() || repProfile.email.split("@")[0];
    const approverName = reviewerProfile?.full_name?.trim() || "Your manager";
    const profileUrl   = repProfile.username
      ? `${APP_URL}/card/${repProfile.username}`
      : `${APP_URL}/stats/${req.user_id}`;

    try {
      const { subject, html } = buildVerificationApprovedEmail({ repName, approverName, profileUrl });
      await sendEmail({ to: repProfile.email, subject, html });
    } catch { /* non-fatal */ }
  }

  return NextResponse.redirect(`${APP_URL}/verify/approved`);
}
