import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTeamContentPosts, logContentPost } from "@/lib/crm-queries";

// GET /api/content?teamId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("team_members").select("team_id, role").eq("user_id", user.id).maybeSingle();
    const { data: managerRow } = await admin
      .from("team_managers").select("team_id").eq("user_id", user.id).eq("team_id", teamId).maybeSingle();

    const isMember  = membership?.team_id === teamId;
    const isManager = !!managerRow;
    if (!isMember && !isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const posts = await getTeamContentPosts(teamId);
    return NextResponse.json(posts);
  } catch (err) {
    console.error("[content GET]", err);
    return NextResponse.json({ error: "Failed to fetch content." }, { status: 500 });
  }
}

// POST /api/content
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { teamId, platform, content_type, date_posted, post_url, views, performance_rating, notes } = body;

    if (!teamId || !platform || !content_type || !date_posted || views == null || !performance_rating) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("team_members").select("team_id").eq("user_id", user.id).eq("team_id", teamId).maybeSingle();
    const { data: managerRow } = await admin
      .from("team_managers").select("team_id").eq("user_id", user.id).eq("team_id", teamId).maybeSingle();

    if (!membership && !managerRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const post = await logContentPost(teamId, user.id, {
      platform,
      content_type,
      date_posted,
      post_url:          post_url || undefined,
      views:             Number(views),
      performance_rating: Number(performance_rating),
      notes:             notes || undefined,
    });

    return NextResponse.json(post);
  } catch (err) {
    console.error("[content POST]", err);
    const msg = err instanceof Error ? err.message : "Failed to log post.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
