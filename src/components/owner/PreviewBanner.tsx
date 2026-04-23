import { PREVIEW_ROLES, previewRoleLabel, type PreviewRoleValue } from "@/lib/preview";
import { clearPreviewRole, setPreviewRole } from "@/app/owner/actions";
import { Eye, X, ChevronDown } from "lucide-react";

interface Props {
  role: PreviewRoleValue;
}

export default function PreviewBanner({ role }: Props) {
  const label = previewRoleLabel(role);

  async function switchRole(formData: FormData) {
    "use server";
    await setPreviewRole(formData.get("role") as string);
  }

  return (
    <div className="sticky top-0 z-50 bg-amber-500/10 border-b border-amber-500/25 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        {/* Left: indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-amber-300 truncate">
            Previewing as{" "}
            <span className="text-amber-200">{label}</span>
          </span>
        </div>

        {/* Right: role switcher + exit */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Role switcher */}
          <form action={switchRole} className="flex items-center gap-1.5">
            <div className="relative">
              <select
                name="role"
                defaultValue={role}
                className="appearance-none bg-amber-500/10 border border-amber-500/25 rounded-lg pl-2.5 pr-7 py-1 text-[11px] font-semibold text-amber-300 focus:outline-none focus:border-amber-400/50 cursor-pointer"
              >
                {PREVIEW_ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#111318] text-[#f0f2f8]">
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-400 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-lg px-2.5 py-1 transition-colors"
            >
              Switch
            </button>
          </form>

          {/* Exit preview */}
          <form action={clearPreviewRole}>
            <button
              type="submit"
              className="flex items-center gap-1 text-[11px] font-semibold text-[#6b7280] hover:text-[#9ca3af] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg px-2.5 py-1 transition-colors"
            >
              <X className="w-3 h-3" /> Exit preview
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
