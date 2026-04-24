"use client";

import Link from "next/link";

const TABS = [
  { key: "log",      label: "Daily Log"    },
  { key: "records",  label: "Call Records" },
  { key: "coaching", label: "Coaching"     },
];

export default function CrmTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 bg-[#111318] border border-[#1e2130] rounded-xl p-1 w-fit">
      {TABS.map(t => (
        <Link
          key={t.key}
          href={`/dashboard/crm?tab=${t.key}`}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            active === t.key
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
              : "text-[#6b7280] hover:text-[#9ca3af]"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
