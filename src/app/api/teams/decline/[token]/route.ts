import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: team, error } = await admin
    .from("teams")
    .update({ status: "suspended" })
    .eq("decline_token", token)
    .eq("status", "pending")
    .select("name")
    .single();

  if (error || !team) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;text-align:center;">
        <h2 style="color:#ef4444;">Not found</h2>
        <p style="color:#64748b;">This decline link is invalid or has already been used.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" }, status: 404 }
    );
  }

  return new NextResponse(
    `<html><body style="font-family:sans-serif;padding:40px;text-align:center;">
      <h2 style="color:#ef4444;">✗ Team declined</h2>
      <p style="color:#64748b;font-size:18px;"><strong>${team.name}</strong> has been declined.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
