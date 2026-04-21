import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { managerName, managerCompany, managerEmail, verificationStartDate } = await request.json();
    if (!managerName?.trim() || !managerCompany?.trim() || !managerEmail?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!verificationStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(verificationStartDate)) {
      return NextResponse.json({ error: "A valid start date is required." }, { status: 400 });
    }
    if (verificationStartDate > new Date().toISOString().split("T")[0]) {
      return NextResponse.json({ error: "Start date cannot be in the future." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Block if already verified or pending
    const { data: existing } = await admin
      .from("verification_requests")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "verified"])
      .maybeSingle();

    if (existing?.status === "verified") {
      return NextResponse.json({ error: "You are already verified." }, { status: 409 });
    }
    if (existing?.status === "pending") {
      return NextResponse.json({ error: "A verification request is already pending." }, { status: 409 });
    }

    // Create verification request
    const { data: req, error: insertError } = await admin
      .from("verification_requests")
      .insert({
        user_id:                  user.id,
        manager_name:             managerName.trim(),
        manager_company:          managerCompany.trim(),
        manager_email:            managerEmail.trim(),
        verification_start_date:  verificationStartDate,
      })
      .select("verify_token, decline_token")
      .single();

    if (insertError || !req) {
      return NextResponse.json({ error: insertError?.message ?? "Failed to create request." }, { status: 500 });
    }

    // Compute period stats for the email
    const endDate = new Date().toISOString().split("T")[0];
    const { data: periodLogs } = await admin
      .from("call_logs")
      .select("calls_taken, shows, offers_made, offers_taken, cash_collected, commission_earned")
      .eq("user_id", user.id)
      .gte("date", verificationStartDate)
      .lte("date", endDate);

    const periodStats = (periodLogs ?? []).reduce(
      (a, r) => ({
        cash:        a.cash        + Number(r.cash_collected    ?? 0),
        commission:  a.commission  + Number(r.commission_earned ?? 0),
        calls:       a.calls       + (r.calls_taken             ?? 0),
        shows:       a.shows       + (r.shows                   ?? 0),
        offersTaken: a.offersTaken + (r.offers_taken            ?? 0),
      }),
      { cash: 0, commission: 0, calls: 0, shows: 0, offersTaken: 0 }
    );
    const showRate    = periodStats.calls > 0 ? (periodStats.shows       / periodStats.calls) * 100 : 0;
    const closeRate   = periodStats.shows > 0 ? (periodStats.offersTaken / periodStats.shows) * 100 : 0;
    const cashPerClose = periodStats.offersTaken > 0 ? periodStats.cash / periodStats.offersTaken : 0;

    // Fetch rep's profile
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const repName  = profile?.full_name?.trim() || profile?.email?.split("@")[0] || user.email?.split("@")[0] || "Sales Rep";
    const repEmail = profile?.email ?? user.email ?? "";

    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verifyUrl  = `${appUrl}/verify/${req.verify_token}`;
    const declineUrl = `${appUrl}/api/verify/decline/${req.decline_token}`;

    const { subject, html } = buildVerificationEmail({
      managerName:  managerName.trim(),
      repName,
      repEmail,
      verifyUrl,
      declineUrl,
      startDate:    verificationStartDate,
      endDate,
      stats: {
        cash:         periodStats.cash,
        commission:   periodStats.commission,
        calls:        periodStats.calls,
        offersTaken:  periodStats.offersTaken,
        showRate,
        closeRate,
        cashPerClose,
        daysLogged:   periodLogs?.length ?? 0,
      },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL ?? "ApexCard <verify@apexcard.app>",
      to:      managerEmail.trim(),
      subject,
      html,
    });

    if (emailError) {
      await admin.from("verification_requests").delete().eq("verify_token", req.verify_token);
      return NextResponse.json({ error: "Failed to send email. Check your Resend config." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify/send]", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
