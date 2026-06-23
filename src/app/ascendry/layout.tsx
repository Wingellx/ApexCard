import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAscendryUser } from "@/lib/ascendry-queries";
import AscendrySidebar from "@/components/ascendry/AscendrySidebar";

export const metadata = { title: "Ascendry" };

export default async function AscendryLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";

  // Preview page is a standalone fullscreen route — skip sidebar and auth
  if (pathname === "/ascendry/preview") {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const ascendryUser = await getAscendryUser(user.id);
  if (!ascendryUser) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex">
      <AscendrySidebar role={ascendryUser.role} displayName={ascendryUser.display_name} />
      <main className="flex-1 lg:ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
