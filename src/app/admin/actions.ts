"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "xwingell@gmail.com";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) throw new Error("Unauthorized");
  return user;
}

export async function approveOwner(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try { await requireAdmin(); } catch { return { error: "Unauthorized." }; }

  const requestId = formData.get("request_id") as string;
  const userId    = formData.get("user_id")    as string;

  const admin = createAdminClient();

  const { error: reqErr } = await admin
    .from("owner_verification_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", requestId);
  if (reqErr) return { error: reqErr.message };

  const { error: profErr } = await admin
    .from("profiles")
    .update({ verified_owner: true })
    .eq("id", userId);
  if (profErr) return { error: profErr.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function rejectOwner(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try { await requireAdmin(); } catch { return { error: "Unauthorized." }; }

  const requestId  = formData.get("request_id")  as string;
  const adminNotes = (formData.get("admin_notes") as string | null)?.trim() || null;

  const admin = createAdminClient();

  const { error } = await admin
    .from("owner_verification_requests")
    .update({ status: "rejected", admin_notes: adminNotes, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
