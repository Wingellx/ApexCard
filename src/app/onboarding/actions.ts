"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function monthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function saveOnboardingProfile(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const full_name   = (formData.get("full_name")  as string).trim();
  const rawUsername = (formData.get("username")   as string).trim().toLowerCase().replace(/\s+/g, "");
  const role        =  formData.get("role")        as string;

  if (!full_name) return { error: "Name is required." };

  if (rawUsername && !/^[a-z0-9_-]{3,30}$/.test(rawUsername)) {
    return { error: "Username must be 3–30 characters: lowercase letters, numbers, _ or -" };
  }

  if (rawUsername) {
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", rawUsername)
      .neq("id", user.id)
      .maybeSingle();
    if (taken) return { error: "That username is already taken. Try another." };
  }

  const validRoles = ["closer", "setter", "operator", "manager"];
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      username:     rawUsername || null,
      role:         validRoles.includes(role) ? role : "closer",
      account_type: "rep",
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function saveTrackingPreference(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const pref = formData.get("tracking_preference") as string;
  if (!["daily", "weekly"].includes(pref)) return { error: "Invalid preference." };

  const { error } = await supabase
    .from("profiles")
    .update({ tracking_preference: pref })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function saveOnboardingGoals(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const cash_target  = parseFloat(formData.get("cash_target")  as string) || 0;
  const calls_target = parseInt(formData.get("calls_target")   as string) || 0;
  const close_rate   = parseFloat(formData.get("close_rate")   as string) || 0;

  const { error } = await supabase
    .from("goals")
    .upsert(
      {
        user_id:           user.id,
        month:             monthStart(),
        cash_target:       Math.max(cash_target, 0),
        calls_target:      Math.max(calls_target, 0),
        close_rate_target: Math.min(Math.max(close_rate, 0), 100),
        show_rate_target:  0,
        commission_target: 0,
        offers_target:     0,
      },
      { onConflict: "user_id,month" }
    );

  if (error) return { error: error.message };
  return {};
}

export async function saveOwnerVerificationRequest(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const full_name         = (formData.get("full_name")         as string).trim();
  const company_name      = (formData.get("company_name")      as string).trim();
  const company_website   = (formData.get("company_website")   as string).trim();
  const offer_description = (formData.get("offer_description") as string).trim();

  if (!full_name)         return { error: "Full name is required." };
  if (!company_name)      return { error: "Company name is required." };
  if (!company_website)   return { error: "Company website is required." };
  if (!offer_description) return { error: "Offer description is required." };

  // Save full_name and account_type to profile
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ full_name, account_type: "owner" })
    .eq("id", user.id);
  if (profileErr) return { error: profileErr.message };

  // Upsert verification request
  const admin = createAdminClient();
  const { error: reqErr } = await admin
    .from("owner_verification_requests")
    .upsert(
      { user_id: user.id, full_name, company_name, company_website, offer_description, status: "pending" },
      { onConflict: "user_id" }
    );
  if (reqErr) return { error: reqErr.message };

  return {};
}

export async function completeOnboarding(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();

  await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  if (profile?.account_type === "owner") {
    redirect("/dashboard/owner");
  } else {
    redirect("/dashboard");
  }
}
