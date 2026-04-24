import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AnalysisResult } from "@/lib/call-analysis-queries";

// Lazily-initialised so a missing key doesn't crash the module at cold-start.
// The guard inside POST will catch it and return a 500 before any DB work.
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SYSTEM_PROMPT =
  "You are an elite sales coach specialising in high-ticket remote sales. " +
  "Analyse this call transcript and return a JSON object with exactly these keys: " +
  "objections (array of objects with: objection_type, objection_text, handled boolean, resolution_text), " +
  "talk_listen_ratio (string estimate e.g. '70/30'), " +
  "tonality_score (1-10), " +
  "confidence_score (1-10), " +
  "key_mistakes (array of strings), " +
  "key_strengths (array of strings), " +
  "coaching_summary (string — direct, specific, actionable feedback on what to improve), " +
  "focus_area (string — the single most important thing to work on from this call).";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { callRecordId } = body as { callRecordId?: string };
    if (!callRecordId) return NextResponse.json({ error: "callRecordId required" }, { status: 400 });

    const admin = createAdminClient();

    // Verify ownership and fetch record
    const { data: record } = await admin
      .from("closer_call_records")
      .select("*")
      .eq("id", callRecordId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!record)           return NextResponse.json({ error: "Record not found" }, { status: 404 });
    if (!record.transcript) return NextResponse.json({ error: "No transcript to analyse" }, { status: 400 });
    if (record.analysis_status === "processing") return NextResponse.json({ error: "Already processing" }, { status: 409 });

    // Mark as processing
    await admin
      .from("closer_call_records")
      .update({ analysis_status: "processing", updated_at: new Date().toISOString() })
      .eq("id", callRecordId);

    // Call OpenAI
    let analysis: AnalysisResult;
    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model:           "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: record.transcript as string },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      analysis = JSON.parse(raw) as AnalysisResult;
    } catch (err) {
      await admin
        .from("closer_call_records")
        .update({ analysis_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", callRecordId);
      console.error("[analyse-call] OpenAI error:", err);
      return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
    }

    // Save analysis result
    await admin
      .from("closer_call_records")
      .update({
        analysis_status: "complete",
        analysis_result: analysis,
        updated_at:      new Date().toISOString(),
      })
      .eq("id", callRecordId);

    // Replace objections (handles re-analysis)
    await admin.from("call_objections").delete().eq("call_record_id", callRecordId);
    const objections = analysis.objections ?? [];
    if (objections.length > 0) {
      await admin.from("call_objections").insert(
        objections.map(o => ({
          call_record_id:  callRecordId,
          objection_type:  o.objection_type  ?? "Unknown",
          objection_text:  o.objection_text  ?? "",
          handled:         o.handled         ?? false,
          resolution_text: o.resolution_text ?? null,
        }))
      );
    }

    // Recalculate monthly metrics (best-effort — don't fail the response if this errors)
    if (record.call_date) {
      try {
        await recalculateMetrics(admin, user.id, record.call_date as string);
      } catch (metricErr) {
        console.error("[analyse-call] metric recalc error:", metricErr);
      }
    }

    return NextResponse.json({ success: true, analysis });
  } catch (err) {
    console.error("[analyse-call]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Metric recalculation ─────────────────────────────────────────

type AdminClient = ReturnType<typeof createAdminClient>;

async function recalculateMetrics(admin: AdminClient, userId: string, callDate: string) {
  // Parse the DATE string as UTC to avoid timezone off-by-one issues.
  // e.g. "2024-04-01" parsed without suffix uses local time, which on UTC-N
  // servers shifts the date to the previous day/month.
  const d = new Date(callDate + "T00:00:00Z");
  const monthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().split("T")[0];
  const monthEnd   = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().split("T")[0];

  const { data: monthCalls } = await admin
    .from("closer_call_records")
    .select("call_outcome, analysis_result")
    .eq("user_id", userId)
    .eq("analysis_status", "complete")
    .gte("call_date", monthStart)
    .lte("call_date", monthEnd);

  if (!monthCalls?.length) return;

  const callsAnalysed = monthCalls.length;
  const closedCount   = monthCalls.filter(c => c.call_outcome === "closed").length;
  const closeRate     = round2(closedCount / callsAnalysed * 100);

  const allObjections:  { type: string; handled: boolean }[] = [];
  const allMistakes:    string[]                             = [];
  const allStrengths:   string[]                             = [];

  for (const call of monthCalls) {
    const ar = call.analysis_result as AnalysisResult | null;
    if (!ar) continue;
    for (const o of ar.objections ?? []) allObjections.push({ type: o.objection_type, handled: o.handled });
    allMistakes.push(...(ar.key_mistakes  ?? []));
    allStrengths.push(...(ar.key_strengths ?? []));
  }

  const handledCount  = allObjections.filter(o => o.handled).length;
  const avgHandleRate = allObjections.length > 0
    ? round2(handledCount / allObjections.length * 100)
    : 0;

  const objTypeCounts = new Map<string, number>();
  for (const o of allObjections) objTypeCounts.set(o.type, (objTypeCounts.get(o.type) ?? 0) + 1);
  const mostCommonObjType = [...objTypeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const topWeakness = mostFrequent(allMistakes);
  const topStrength = mostFrequent(allStrengths);

  // Composite score: close rate 40% + handle rate 40% + volume bonus up to 20
  const volumeBonus     = Math.min(20, callsAnalysed * 4);
  const improvementScore = Math.min(100, Math.round((closeRate * 0.4 + avgHandleRate * 0.4 + volumeBonus) * 10) / 10);

  await admin
    .from("closer_improvement_metrics")
    .upsert(
      {
        user_id:               userId,
        month:                 monthStart,
        calls_analysed:        callsAnalysed,
        avg_handle_rate:       avgHandleRate,
        most_common_objection: mostCommonObjType,
        close_rate:            closeRate,
        improvement_score:     improvementScore,
        top_weakness:          topWeakness ?? null,
        top_strength:          topStrength ?? null,
        updated_at:            new Date().toISOString(),
      },
      { onConflict: "user_id,month" }
    );
}

function round2(n: number) { return Math.round(n * 100) / 100; }

function mostFrequent(arr: string[]): string | null {
  if (!arr.length) return null;
  const counts = new Map<string, number>();
  for (const item of arr) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
