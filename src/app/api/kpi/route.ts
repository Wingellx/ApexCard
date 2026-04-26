import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const NUMERIC_FIELDS = ["ad_spend", "cash_collected", "revenue"] as const;
const INT_FIELDS = ["follows", "inb_leads", "dms", "convos", "calls_taken", "calls_closed"] as const;
const ALL_FIELDS = [...NUMERIC_FIELDS, ...INT_FIELDS] as const;

// GET /api/kpi?year=2026
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const year = new URL(request.url).searchParams.get("year") ?? new Date().getFullYear().toString();

  const { data, error } = await supabase
    .from("closing_kpi_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", parseInt(year, 10))
    .order("month");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] });
}

// POST /api/kpi — upsert a single month row
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { year, month, field, value } = body;

  if (!year || !month || !field) {
    return NextResponse.json({ error: "year, month, field required" }, { status: 400 });
  }
  if (!ALL_FIELDS.includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  const parsed = NUMERIC_FIELDS.includes(field as typeof NUMERIC_FIELDS[number])
    ? parseFloat(value ?? "0") || 0
    : parseInt(value ?? "0", 10) || 0;

  const { error } = await supabase
    .from("closing_kpi_entries")
    .upsert(
      { user_id: user.id, year, month, [field]: parsed },
      { onConflict: "user_id,year,month", ignoreDuplicates: false }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
