import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(unset)";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "(unset)";
  console.log("[teams/approve] SUPABASE_URL:", url);
  console.log("[teams/approve] SERVICE_ROLE_KEY prefix:", key.slice(0, 10));
  console.log("[teams/approve] token:", token);

  const admin = createAdminClient();

  const { data: team, error } = await admin
    .from("teams")
    .update({ status: "active" })
    .eq("approve_token", token)
    .eq("status", "pending")
    .select("name")
    .single();

  console.log("[teams/approve] data:", JSON.stringify(team));
  console.log("[teams/approve] error:", JSON.stringify(error));

  if (error || !team) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;text-align:center;">
        <h2 style="color:#ef4444;">Not found</h2>
        <p style="color:#64748b;">This approval link is invalid or has already been used.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" }, status: 404 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.apexcard.app";
  return NextResponse.redirect(`${appUrl}/dashboard/crm/manager`);
}
