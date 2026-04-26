import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const COLUMN_MAP: Record<string, string> = {
  "Ad Spend":       "ad_spend",
  "Follows":        "follows",
  "INB Leads":      "inb_leads",
  "DMsToConvo":     "dms",    // raw DMs column
  "DMs":            "dms",
  "Convos":         "convos",
  "Calls Taken":    "calls_taken",
  "Calls Closed":   "calls_closed",
  "Cash Collected": "cash_collected",
  "Revenue":        "revenue",
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function getValidToken(connection: { access_token: string; refresh_token: string; token_expiry: string }) {
  const expiry = new Date(connection.token_expiry);
  // Refresh if expires within 5 minutes
  if (expiry.getTime() - Date.now() < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(connection.refresh_token);
    if (!refreshed) return null;
    return refreshed.access_token;
  }
  return connection.access_token;
}

// POST /api/google/sync — body: { direction: "pull" | "push", year: number, sheetId?: string, sheetName?: string }
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { direction, year, sheetId: bodySheetId, sheetName: bodySheetName } = body;
  const currentYear = year ?? new Date().getFullYear();

  if (direction !== "pull" && direction !== "push") {
    return NextResponse.json({ error: "direction must be pull or push" }, { status: 400 });
  }

  // Load connection
  const { data: conn } = await supabase
    .from("google_sheet_connections")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn) return NextResponse.json({ error: "No Google Sheet connected" }, { status: 400 });

  // Allow updating sheetId/sheetName from request
  const sheetId = bodySheetId ?? conn.sheet_id;
  const sheetName = bodySheetName ?? conn.sheet_name;

  if (!sheetId) return NextResponse.json({ error: "No sheet ID configured" }, { status: 400 });

  // Update connection if sheet details changed
  if (bodySheetId || bodySheetName) {
    await supabase.from("google_sheet_connections").update({
      sheet_id: sheetId,
      sheet_name: sheetName,
    }).eq("user_id", user.id);
  }

  const token = await getValidToken(conn);
  if (!token) return NextResponse.json({ error: "Failed to refresh Google token" }, { status: 401 });

  const range = sheetName ? `${sheetName}!A:Z` : "A:Z";
  const sheetsBase = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;

  if (direction === "pull") {
    // ── Pull: read sheet → upsert into closing_kpi_entries ──────────────────
    const res = await fetch(`${sheetsBase}/values/${encodeURIComponent(range)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Sheets API error: ${err}` }, { status: 502 });
    }

    const { values } = await res.json() as { values?: string[][] };
    if (!values || values.length < 2) {
      return NextResponse.json({ error: "Sheet appears empty or has no header row" }, { status: 400 });
    }

    const headers = values[0].map((h) => h.trim());
    const monthIdx = headers.findIndex((h) => h.toLowerCase() === "month");
    if (monthIdx === -1) return NextResponse.json({ error: "Sheet missing 'Month' column" }, { status: 400 });

    const upserts: Record<string, unknown>[] = [];

    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const monthName = row[monthIdx]?.trim() ?? "";
      const monthNum = MONTH_NAMES.findIndex((m) => m.toLowerCase() === monthName.toLowerCase()) + 1;
      if (monthNum < 1 || monthNum > 12) continue;

      const entry: Record<string, unknown> = { user_id: user.id, year: currentYear, month: monthNum };

      headers.forEach((header, colIdx) => {
        const field = COLUMN_MAP[header];
        if (!field || colIdx >= row.length) return;
        const raw = row[colIdx]?.replace(/[$,%]/g, "").trim();
        const num = parseFloat(raw);
        if (!isNaN(num)) entry[field] = num;
      });

      upserts.push(entry);
    }

    if (upserts.length > 0) {
      const { error: dbErr } = await supabase
        .from("closing_kpi_entries")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(upserts as any[], { onConflict: "user_id,year,month" });
      if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, imported: upserts.length });
  }

  // ── Push: read closing_kpi_entries → write to sheet ──────────────────────
  const { data: entries } = await supabase
    .from("closing_kpi_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", currentYear)
    .order("month");

  const headers = [
    "Month","Ad Spend","Follows","INB Leads","DMs","DMs to Convo %",
    "Convos","Convo to Call %","Calls Taken","Close %","Calls Closed","Cash Collected","Revenue",
  ];

  const rows: (string | number)[][] = [headers];

  for (const e of entries ?? []) {
    const dmsToConvo  = e.dms > 0 ? `${((e.convos / e.dms) * 100).toFixed(1)}%` : "-";
    const convoToCall = e.convos > 0 ? `${((e.calls_taken / e.convos) * 100).toFixed(1)}%` : "-";
    const closeRate   = e.calls_taken > 0 ? `${((e.calls_closed / e.calls_taken) * 100).toFixed(1)}%` : "-";

    rows.push([
      MONTH_NAMES[e.month - 1],
      e.ad_spend,
      e.follows,
      e.inb_leads,
      e.dms,
      dmsToConvo,
      e.convos,
      convoToCall,
      e.calls_taken,
      closeRate,
      e.calls_closed,
      e.cash_collected,
      e.revenue,
    ]);
  }

  // Clear existing data then write
  await fetch(`${sheetsBase}/values/${encodeURIComponent(range)}:clear`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });

  const writeRes = await fetch(
    `${sheetsBase}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.text();
    return NextResponse.json({ error: `Sheets write error: ${err}` }, { status: 502 });
  }

  return NextResponse.json({ ok: true, pushed: rows.length - 1 });
}

// PATCH /api/google/sync — save sheet ID/name to the connection record
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sheet_id, sheet_name } = await request.json();
  if (!sheet_id) return NextResponse.json({ error: "sheet_id required" }, { status: 400 });

  const { error } = await supabase.from("google_sheet_connections")
    .update({ sheet_id, sheet_name: sheet_name ?? "" })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
