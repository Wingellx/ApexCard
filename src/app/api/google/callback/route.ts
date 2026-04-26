import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/google/callback — exchange code for tokens, store connection
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const kpiUrl = new URL("/dashboard/kpi", request.url);

  if (error || !code) {
    kpiUrl.searchParams.set("error", "google_auth_failed");
    return NextResponse.redirect(kpiUrl.toString());
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://apexcard.app"}/api/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    kpiUrl.searchParams.set("error", "token_exchange_failed");
    return NextResponse.redirect(kpiUrl.toString());
  }

  const tokens = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokens;

  const tokenExpiry = new Date(Date.now() + (expires_in ?? 3600) * 1000).toISOString();

  // We don't know the sheet ID yet — user will enter it in the UI
  // Store a placeholder connection with empty sheet_id; user configures it in the dashboard
  await supabase.from("google_sheet_connections").upsert(
    {
      user_id: user.id,
      sheet_id: "",
      sheet_name: "",
      access_token,
      refresh_token: refresh_token ?? "",
      token_expiry: tokenExpiry,
    },
    { onConflict: "user_id" }
  );

  kpiUrl.searchParams.set("connected", "1");
  return NextResponse.redirect(kpiUrl.toString());
}
