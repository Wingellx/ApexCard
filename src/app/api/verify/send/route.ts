import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicLifetimeStats } from "@/lib/queries";
import { buildVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { managerName, managerCompany, managerEmail } = await request.json();
    if (!managerName?.trim() || !managerCompany?.trim() || !managerEmail?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
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
        user_id:         user.id,
        manager_name:    managerName.trim(),
        manager_company: managerCompany.trim(),
        manager_email:   managerEmail.trim(),
      })
      .select("verify_token, decline_token")
      .single();

    if (insertError || !req) {
      return NextResponse.json({ error: insertError?.message ?? "Failed to create request." }, { status: 500 });
    }

    // Fetch stats for the email
    const stats = await getPublicLifetimeStats(user.id);
    const repName = stats?.name ?? user.email ?? "Sales Rep";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const verifyUrl  = `${appUrl}/verify/${req.verify_token}`;
    const declineUrl = `${appUrl}/api/verify/decline/${req.decline_token}`;

    // Fetch rep's profile email
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    const { subject, html } = buildVerificationEmail({
      managerName: managerName.trim(),
      repName,
      repEmail: profile?.email ?? user.email ?? "",
      verifyUrl,
      declineUrl,
      stats: {
        cash:         stats?.totals.cash         ?? 0,
        commission:   stats?.totals.commission   ?? 0,
        calls:        stats?.totals.calls        ?? 0,
        offersTaken:  stats?.totals.offersTaken  ?? 0,
        showRate:     stats?.showRate            ?? 0,
        closeRate:    stats?.closeRate           ?? 0,
        cashPerClose: stats?.cashPerClose        ?? 0,
        daysLogged:   stats?.daysLogged          ?? 0,
      },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailError } = await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL ?? "ApexCard <verify@apexcard.com>",
      to:      managerEmail.trim(),
      subject,
      html,
    });

    if (emailError) {
      // Roll back the request row so the user can retry
      await admin.from("verification_requests").delete().eq("verify_token", req.verify_token);
      return NextResponse.json({ error: "Failed to send email. Check your Resend config." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify/send]", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
