"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import {
  buildRepVerificationRequestEmail,
  buildVerificationApprovedEmail,
  buildVerificationDeclinedEmail,
} from "@/lib/email";
import { approveRepVerification, declineRepVerification } from "@/lib/verification-queries";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.apexcard.app";

async function getAuthedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Rep: request verification from a manager ─────────────────────────────────

export async function requestManagerVerification(
  managerId: string
): Promise<{ error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Unauthorized" };

  const admin = createAdminClient();

  // Block if already pending/approved
  const { data: existing } = await admin
    .from("rep_verification_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing?.status === "approved") return { error: "You are already verified." };
  if (existing?.status === "pending")  return { error: "A verification request is already pending." };

  // Fetch manager profile
  const { data: manager } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", managerId)
    .maybeSingle();

  if (!manager?.email) return { error: "Manager not found." };

  // Fetch rep profile + stats
  const { data: repProfile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const repName  = repProfile?.full_name?.trim() || repProfile?.email?.split("@")[0] || "Sales Rep";
  const repEmail = repProfile?.email ?? user.email ?? "";

  const { data: logs } = await admin
    .from("call_logs")
    .select("calls_taken, shows, offers_taken, cash_collected")
    .eq("user_id", user.id);

  const totals = (logs ?? []).reduce(
    (a, r) => ({
      calls:  a.calls  + (r.calls_taken  ?? 0),
      shows:  a.shows  + (r.shows        ?? 0),
      closed: a.closed + (r.offers_taken ?? 0),
      cash:   a.cash   + Number(r.cash_collected ?? 0),
    }),
    { calls: 0, shows: 0, closed: 0, cash: 0 }
  );

  // Insert request
  const { data: req, error: insertErr } = await admin
    .from("rep_verification_requests")
    .insert({
      user_id:        user.id,
      requested_from: managerId,
      request_type:   "manager",
      status:         "pending",
    })
    .select("id")
    .single();

  if (insertErr || !req) return { error: "Failed to create request. Please try again." };

  // Email the manager
  const approveUrl = `${APP_URL}/api/verify/rep/approve/${req.id}`;
  const declineUrl = `${APP_URL}/api/verify/rep/decline/${req.id}`;

  try {
    const { subject, html } = buildRepVerificationRequestEmail({
      managerName: manager.full_name?.trim() || manager.email.split("@")[0],
      repName,
      repEmail,
      stats: {
        cash:      totals.cash,
        calls:     totals.calls,
        closed:    totals.closed,
        closeRate: totals.shows > 0 ? (totals.closed / totals.shows) * 100 : 0,
        daysLogged: logs?.length ?? 0,
      },
      approveUrl,
      declineUrl,
    });
    await sendEmail({ to: manager.email, subject, html });
  } catch {
    // Clean up the request if email fails
    await admin.from("rep_verification_requests").delete().eq("id", req.id);
    return { error: "Failed to send notification email. Please try again." };
  }

  revalidatePath("/dashboard/stats");
  return {};
}

// ── Rep: request verification from owner (ApexCard directly) ─────────────────

export async function requestOwnerVerification(
  proofUrl: string,
  proofNotes: string
): Promise<{ error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Unauthorized" };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("rep_verification_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing?.status === "approved") return { error: "You are already verified." };
  if (existing?.status === "pending")  return { error: "A verification request is already pending." };

  // Owner = the platform itself; we use a placeholder UUID from env or a known owner ID
  // For the owner portal we query all owner-path requests — no specific requested_from needed
  const { error: insertErr } = await admin
    .from("rep_verification_requests")
    .insert({
      user_id:        user.id,
      requested_from: user.id, // self-referential placeholder; owner portal shows all type='owner' requests
      request_type:   "owner",
      proof_url:      proofUrl.trim() || null,
      proof_notes:    proofNotes.trim() || null,
      status:         "pending",
    });

  if (insertErr) return { error: "Failed to submit request. Please try again." };

  revalidatePath("/dashboard/stats");
  return {};
}

// ── Manager/Owner: approve ────────────────────────────────────────────────────

export async function approveVerificationRequest(
  requestId: string
): Promise<{ error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Unauthorized" };

  const result = await approveRepVerification(requestId, user.id);
  if (result.error) return result;

  // Email the rep
  const admin = createAdminClient();
  const { data: req } = await admin
    .from("rep_verification_requests")
    .select("user_id")
    .eq("id", requestId)
    .maybeSingle();

  if (req) {
    const [{ data: repProfile }, { data: reviewerProfile }] = await Promise.all([
      admin.from("profiles").select("full_name, email").eq("id", req.user_id).maybeSingle(),
      admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    ]);

    if (repProfile?.email) {
      const repName      = repProfile.full_name?.trim() || repProfile.email.split("@")[0];
      const approverName = reviewerProfile?.full_name?.trim() || "Your manager";
      const username     = (await admin.from("profiles").select("username").eq("id", req.user_id).maybeSingle()).data?.username;
      const profileUrl   = username ? `${APP_URL}/card/${username}` : `${APP_URL}/stats/${req.user_id}`;

      try {
        const { subject, html } = buildVerificationApprovedEmail({ repName, approverName, profileUrl });
        await sendEmail({ to: repProfile.email, subject, html });
      } catch { /* non-fatal */ }
    }
  }

  revalidatePath("/dashboard/crm/manager");
  revalidatePath("/owner");
  return {};
}

// ── Manager/Owner: decline ────────────────────────────────────────────────────

export async function declineVerificationRequest(
  requestId: string
): Promise<{ error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Unauthorized" };

  const admin = createAdminClient();

  // Fetch before declining so we can email the rep
  const { data: req } = await admin
    .from("rep_verification_requests")
    .select("user_id")
    .eq("id", requestId)
    .maybeSingle();

  const result = await declineRepVerification(requestId, user.id);
  if (result.error) return result;

  if (req) {
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
  }

  revalidatePath("/dashboard/crm/manager");
  revalidatePath("/owner");
  return {};
}
