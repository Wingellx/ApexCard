"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function submitContactForm(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const name    = (formData.get("name")    as string).trim();
  const email   = (formData.get("email")   as string).trim().toLowerCase();
  const message = (formData.get("message") as string).trim();

  if (!name || name.length < 2)      return { error: "Please enter your name." };
  if (!email || !email.includes("@")) return { error: "Please enter a valid email." };
  if (!message || message.length < 10) return { error: "Message must be at least 10 characters." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_submissions")
    .insert({ name, email, message });

  if (error) return { error: "Something went wrong. Please try again." };

  return { success: true };
}
