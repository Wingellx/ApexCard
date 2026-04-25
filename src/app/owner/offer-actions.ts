"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfileFull } from "@/lib/queries";

export async function postOffer(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const profile = await getProfileFull(user.id);
  if (!profile || profile.account_type !== "owner")
    return { error: "Owner account required." };

  const title = (formData.get("title") as string).trim();
  const companyName = (formData.get("company_name") as string).trim();
  const roleType = formData.get("role_type") as string;
  const niche = (formData.get("niche") as string).trim();
  const applicationUrl = (formData.get("application_url") as string).trim();

  if (!title || !companyName || !roleType || !niche || !applicationUrl)
    return { error: "Title, company, role type, niche and application URL are required." };

  const commissionRaw = (formData.get("commission_pct") as string).trim();
  const basePayRaw = (formData.get("base_pay") as string).trim();
  const expiresAtRaw = (formData.get("expires_at") as string).trim();

  const admin = createAdminClient();
  const { error } = await admin.from("offers").insert({
    title,
    company_name:    companyName,
    role_type:       roleType,
    niche,
    commission_pct:  commissionRaw ? Number(commissionRaw) : null,
    base_pay:        basePayRaw    ? Number(basePayRaw)    : null,
    description:     ((formData.get("description") as string) ?? "").trim(),
    requirements:    ((formData.get("requirements") as string) ?? "").trim(),
    application_url: applicationUrl,
    is_active:       true,
    is_featured:     formData.get("is_featured") === "on",
    team_id:         null,
    posted_by:       user.id,
    expires_at:      expiresAtRaw || null,
  });

  if (error) return { error: error.message };

  redirect("/offers");
}
