"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TRELLO_KEY = process.env.NEXT_PUBLIC_TRELLO_API_KEY!;

async function getAuthedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Save token from OAuth callback ────────────────────────────────────────────

export async function saveTrelloToken(
  token: string
): Promise<{ error?: string } | void> {
  const { supabase, user } = await getAuthedUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("trello_connections")
    .upsert({ user_id: user.id, token }, { onConflict: "user_id" });

  if (error) {
    console.error("[saveTrelloToken]", error.message);
    return { error: error.message };
  }
  revalidatePath("/dashboard/io");
}

// ── Save selected board ───────────────────────────────────────────────────────

export async function saveTrelloBoard(
  boardId: string,
  boardName: string
): Promise<{ error?: string } | void> {
  const { supabase, user } = await getAuthedUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("trello_connections")
    .update({ board_id: boardId, board_name: boardName })
    .eq("user_id", user.id);

  if (error) {
    console.error("[saveTrelloBoard]", error.message);
    return { error: error.message };
  }
  revalidatePath("/dashboard/io");
}

// ── Disconnect Trello ─────────────────────────────────────────────────────────

export async function disconnectTrello(): Promise<{ error?: string } | void> {
  const { supabase, user } = await getAuthedUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("trello_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/io");
}

// ── Archive (complete) a card ─────────────────────────────────────────────────

export async function completeTrelloCard(
  cardId: string
): Promise<{ error?: string } | void> {
  const { supabase, user } = await getAuthedUser();
  if (!user) return { error: "Not authenticated." };

  const { data: conn } = await supabase
    .from("trello_connections")
    .select("token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!conn?.token) return { error: "Trello not connected." };

  const res = await fetch(
    `https://api.trello.com/1/cards/${cardId}?key=${TRELLO_KEY}&token=${conn.token}`,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ closed: true }) }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("[completeTrelloCard]", res.status, text);
    return { error: "Could not update card in Trello." };
  }

  revalidatePath("/dashboard/io");
}

// ── Fetch helpers (called from server components) ─────────────────────────────

export interface TrelloBoard { id: string; name: string }
export interface TrelloCard  {
  id:     string;
  name:   string;
  desc:   string;
  due:    string | null;
  url:    string;
  closed: boolean;
  idList: string;
}

export async function fetchTrelloBoards(token: string): Promise<TrelloBoard[]> {
  try {
    const res = await fetch(
      `https://api.trello.com/1/members/me/boards?key=${TRELLO_KEY}&token=${token}&filter=open&fields=id,name`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data as TrelloBoard[];
  } catch {
    return [];
  }
}

export async function fetchTrelloCards(token: string, boardId: string): Promise<TrelloCard[]> {
  try {
    const res = await fetch(
      `https://api.trello.com/1/boards/${boardId}/cards?key=${TRELLO_KEY}&token=${token}&filter=open&fields=id,name,desc,due,url,closed,idList`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data as TrelloCard[]).filter(c => !c.closed);
  } catch {
    return [];
  }
}
