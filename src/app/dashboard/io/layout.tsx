import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIsIOmember } from "@/lib/io-queries";
import IONav from "@/components/io/IONav";

export default async function IOLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const isMember = await getIsIOmember(user.id);
  if (!isMember) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <IONav />
      {children}
    </div>
  );
}
