"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { buildApplicationSubmittedEmail, buildApplicationStatusEmail, buildApplicationReceivedEmail } from "@/lib/email";
import { logPhaseHistory } from "@/lib/echelon-queries";
import type { ApplicationStatus } from "@/lib/offers-queries";

export async function submitApplication(
  offerId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  const { data: offer } = await admin
    .from("offers")
    .select("id, title, company_name, application_limit, application_count, posted_by")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer) return { error: "Offer not found" };
  if ((offer.application_count ?? 0) >= (offer.application_limit ?? 50)) {
    return { error: "Applications are closed for this offer" };
  }

  const { data: existing } = await admin
    .from("offer_applications")
    .select("id")
    .eq("offer_id", offerId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return { error: "You've already applied to this offer" };

  const appliedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await admin
    .from("offer_applications")
    .insert({
      offer_id:   offerId,
      user_id:    user.id,
      status:     "submitted",
      applied_at: appliedAt,
      expires_at: expiresAt,
    });

  if (insertError) return { error: insertError.message };

  await admin
    .from("offers")
    .update({ application_count: (offer.application_count ?? 0) + 1 })
    .eq("id", offerId);

  const appUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.apexcard.app"}`;

  const [repResult, statsResult] = await Promise.all([
    admin.from("profiles").select("full_name, email, username, is_verified, verification_active, role").eq("id", user.id).maybeSingle(),
    admin.from("call_logs").select("shows, offers_taken, cash_collected").eq("user_id", user.id),
  ]);
  const rep  = repResult.data;
  const logs = statsResult.data ?? [];

  // Confirmation email to the rep
  if (rep?.email) {
    const conf = buildApplicationReceivedEmail({
      repName:    rep.full_name ?? "there",
      offerTitle: offer.title as string,
      company:    offer.company_name as string,
      appUrl:     `${appUrl}/dashboard/applications`,
    });
    await sendEmail({ to: rep.email, subject: conf.subject, html: conf.html });
  }

  // Notification email to the owner
  if (offer.posted_by) {
    const { data: owner } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", offer.posted_by)
      .maybeSingle();

    if (owner?.email) {
      const cash   = logs.reduce((a, l) => a + Number(l.cash_collected ?? 0), 0);
      const shows  = logs.reduce((a, l) => a + (l.shows        ?? 0), 0);
      const closed = logs.reduce((a, l) => a + (l.offers_taken ?? 0), 0);

      const email = buildApplicationSubmittedEmail({
        ownerName:      owner.full_name ?? "there",
        repName:        rep?.full_name  ?? "A rep",
        repEmail:       rep?.email      ?? "",
        repUsername:    rep?.username   ?? null,
        repRole:        rep?.role       ?? null,
        isVerified:     (rep as { is_verified?: boolean } | null)?.is_verified ?? false,
        lifetimeCash:   cash,
        closeRate:      shows > 0 ? (closed / shows) * 100 : 0,
        daysLogged:     logs.length,
        offerTitle:     offer.title as string,
        ownerPortalUrl: `${appUrl}/owner`,
      });
      await sendEmail({ to: owner.email, subject: email.subject, html: email.html });
    }
  }

  revalidatePath("/offers");
  revalidatePath("/dashboard/applications");
  return {};
}

export async function closeOffer(offerId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  const { data: offer } = await admin
    .from("offers")
    .select("id, posted_by")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer) return { error: "Offer not found" };
  if (offer.posted_by !== user.id) return { error: "Not authorized" };

  const { error: updateError } = await admin
    .from("offers")
    .update({ is_active: false, fulfilled_at: new Date().toISOString() })
    .eq("id", offerId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/offers");
  revalidatePath("/owner");
  return {};
}

export async function toggleSavedOffer(
  offerId: string,
  isSaved: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  if (isSaved) {
    await admin.from("saved_offers").delete().eq("user_id", user.id).eq("offer_id", offerId);
  } else {
    await admin
      .from("saved_offers")
      .upsert(
        { user_id: user.id, offer_id: offerId, saved_at: new Date().toISOString() },
        { onConflict: "user_id,offer_id" }
      );
  }

  revalidatePath("/offers");
  return {};
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();

  const { data: app } = await admin
    .from("offer_applications")
    .select("id, user_id, offer_id, offers(title, company_name, posted_by)")
    .eq("id", applicationId)
    .maybeSingle();

  if (!app) return { error: "Application not found" };

  type OfferJoin = { title: string; company_name: string; posted_by: string | null } | null;
  const offer = app.offers as unknown as OfferJoin;
  if (offer?.posted_by !== user.id) return { error: "Not authorized" };

  const { error: updateError } = await admin
    .from("offer_applications")
    .update({ status })
    .eq("id", applicationId);

  if (updateError) return { error: updateError.message };

  const { data: rep } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", app.user_id as string)
    .maybeSingle();

  if (rep?.email) {
    const email = buildApplicationStatusEmail({
      repName:    rep.full_name ?? "there",
      status,
      offerTitle: offer?.title        ?? "the offer",
      company:    offer?.company_name ?? "",
      appUrl:     `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.apexcard.app"}/dashboard/applications`,
    });
    await sendEmail({ to: rep.email, subject: email.subject, html: email.html });
  }

  // Path C: if accepted, auto-promote to on_offer for the user's Echelon team
  if (status === "accepted") {
    const { data: teamMembership } = await admin
      .from("team_members")
      .select("team_id, phase")
      .eq("user_id", app.user_id as string)
      .maybeSingle();

    if (teamMembership && teamMembership.phase !== "on_offer") {
      await admin
        .from("team_members")
        .update({ phase: "on_offer", phase_updated_at: new Date().toISOString() })
        .eq("user_id", app.user_id as string)
        .eq("team_id", teamMembership.team_id as string);

      await logPhaseHistory({
        userId:    app.user_id as string,
        teamId:    teamMembership.team_id as string,
        fromPhase: (teamMembership.phase as string) ?? "outreach",
        toPhase:   "on_offer",
        changedBy: user.id,
      });
    }
  }

  revalidatePath("/owner");
  revalidatePath("/dashboard/applications");
  return {};
}
