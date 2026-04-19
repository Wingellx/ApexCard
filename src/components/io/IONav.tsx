"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Zap, Target, Dumbbell, Trophy, Activity } from "lucide-react";

const tabs = [
  { href: "/dashboard/io",             label: "Dashboard",  icon: Zap      },
  { href: "/dashboard/io/checkin",     label: "Debrief",    icon: Target   },
  { href: "/dashboard/io/training",    label: "Training",   icon: Dumbbell },
  { href: "/dashboard/io/leaderboard", label: "Leaderboard",icon: Trophy   },
  { href: "/dashboard/io/body",        label: "Body",       icon: Activity },
];

export default function IONav() {
  const pathname = usePathname();

  function active(href: string) {
    if (href === "/dashboard/io") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="sticky top-14 lg:top-0 z-30 bg-[#0a0b0f]/95 backdrop-blur border-b border-[#1e2130]">
      <div className="px-4 sm:px-8 max-w-[1200px]">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0">
          {tabs.map(({ href, label, icon: Icon }) => {
            const isActive = active(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors shrink-0",
                  isActive
                    ? "border-white/60 text-white"
                    : "border-transparent text-[#4b5563] hover:text-[#9ca3af] hover:border-[#2d3147]"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
