import { Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import GoalsForm from "@/components/dashboard/GoalsForm";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function GoalsPage() {
  const month = currentMonth();
  const monthDate = `${month}-01`;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let existing = null;
  if (user) {
    const { data } = await supabase
      .from("goals")
      .select("calls_target, show_rate_target, close_rate_target, offers_target, cash_target, commission_target")
      .eq("user_id", user.id)
      .eq("month", monthDate)
      .maybeSingle();
    existing = data;
  }

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1200px]">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
          <Target className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Goals</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            Set your monthly targets. Saving overwrites any existing goals for that month.
          </p>
        </div>
      </div>

      <GoalsForm initialMonth={month} existing={existing} />
    </div>
  );
}
