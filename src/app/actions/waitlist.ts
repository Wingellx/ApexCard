"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { buildWaitlistWelcomeEmail } from "@/lib/email";

export type WaitlistResult =
  | { success: true; count: number; alreadyJoined?: boolean }
  | { error: string };

export async function joinWaitlist(
  _prev: WaitlistResult | null,
  formData: FormData
): Promise<WaitlistResult> {
  const raw = (formData.get("email") as string ?? "").trim().toLowerCase();

  if (!raw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return { error: "Please enter a valid email address." };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("waitlist")
    .select("id")
    .eq("email", raw)
    .maybeSingle();

  if (existing) {
    const { count } = await admin
      .from("waitlist")
      .select("*", { count: "exact", head: true });
    return { success: true, count: count ?? 0, alreadyJoined: true };
  }

  const { error } = await admin.from("waitlist").insert({ email: raw });
  if (error) return { error: "Something went wrong. Please try again." };

  const { count } = await admin
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  const welcome = buildWaitlistWelcomeEmail();
  await sendEmail({ to: raw, subject: welcome.subject, html: welcome.html });

  return { success: true, count: count ?? 1 };
}

export async function getWaitlistCount(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("waitlist")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}
