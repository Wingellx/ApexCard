import { getMemberCloserFields, getMemberCloserLog } from "@/lib/closer-crm-queries";

interface Props {
  memberId: string;
  memberName: string;
}

function formatValue(fieldType: string, log: { number: number | null; boolean: boolean | null; text: string | null } | undefined): string {
  if (!log) return "—";
  if (fieldType === "boolean") return log.boolean ? "Yes" : "No";
  if (fieldType === "duration") return log.number != null ? `${log.number}m` : "—";
  if (fieldType === "text")     return log.text ?? "—";
  return log.number != null ? String(log.number) : "—";
}

export default async function CloserCrmPanel({ memberId, memberName }: Props) {
  const fields = await getMemberCloserFields(memberId);
  if (fields.length === 0) return null;

  const today   = new Date().toISOString().split("T")[0];
  const logMap  = await getMemberCloserLog(memberId, today, fields.map(f => f.id));

  return (
    <div className="mt-3 bg-[#0d0f15] border border-[#1e2130] rounded-xl px-4 py-3">
      <p className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-wider mb-2.5">
        Today&apos;s Log — {memberName}
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {fields.map(f => {
          const log = logMap[f.id];
          return (
            <div key={f.id}>
              <p className="text-[10px] text-[#4b5563] uppercase tracking-wider">{f.field_label}</p>
              <p className="text-sm font-semibold text-[#f0f2f8]">
                {formatValue(f.field_type, log)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
