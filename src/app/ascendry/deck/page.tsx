import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAscendryUser, getClients, getCallSessions, getPitchDecks } from "@/lib/ascendry-queries";
import DeckPage from "@/components/ascendry/DeckPage";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const ascendryUser = await getAscendryUser(user.id);
  if (!ascendryUser) redirect("/ascendry");

  const [clients, sessions, decks] = await Promise.all([
    getClients(),
    getCallSessions(),
    getPitchDecks(),
  ]);

  return (
    <div className="pt-14 lg:pt-0">
      <DeckPage clients={clients} sessions={sessions} decks={decks} />
    </div>
  );
}
