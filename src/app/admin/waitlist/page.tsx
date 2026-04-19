import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Mail, Users, Download } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "xwingell@gmail.com";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function WaitlistAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");

  const admin = createAdminClient();
  const { data: signups, count } = await admin
    .from("waitlist")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  const rows = signups ?? [];
  const total = count ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0b0f] px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin" className="text-xs text-[#6b7280] hover:text-[#f0f2f8] transition-colors">
                ← Admin
              </Link>
            </div>
            <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Waitlist</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">All signups from the landing page.</p>
          </div>

          {/* Stats */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-xl px-6 py-4 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#f0f2f8] tabular-nums">{total.toLocaleString()}</p>
              <p className="text-xs text-[#6b7280]">total signups</p>
            </div>
          </div>
        </div>

        {/* Export hint */}
        {rows.length > 0 && (
          <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-4 flex items-center gap-3">
            <Download className="w-4 h-4 text-[#6b7280] shrink-0" />
            <p className="text-xs text-[#6b7280]">
              To export, copy from the list below or run:{" "}
              <code className="bg-[#0d0f15] border border-[#1e2130] px-1.5 py-0.5 rounded text-[#f0f2f8]">
                SELECT email FROM waitlist ORDER BY created_at DESC;
              </code>
            </p>
          </div>
        )}

        {/* Table */}
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 bg-[#1e2130] rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-[#6b7280]" />
              </div>
              <p className="font-semibold text-[#f0f2f8] mb-1">No signups yet</p>
              <p className="text-sm text-[#6b7280]">Share the waitlist page to start collecting emails.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2130] bg-[#0d0f15]">
                  <th className="text-left text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest px-5 py-3">
                    Email
                  </th>
                  <th className="text-right text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest px-5 py-3">
                    Signed up
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-[#1e2130] last:border-0 ${i % 2 === 0 ? "" : "bg-[#0d0f15]/30"}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <Mail className="w-3 h-3 text-indigo-400" />
                        </div>
                        <span className="text-[#f0f2f8] font-medium">{row.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#6b7280] tabular-nums whitespace-nowrap text-xs">
                      {formatDate(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {rows.length > 0 && (
          <p className="text-center text-xs text-[#4b5563]">
            Showing all {total.toLocaleString()} signup{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
