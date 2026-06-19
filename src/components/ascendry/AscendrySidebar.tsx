"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart2, Kanban, TrendingUp, DollarSign, FileText, BookOpen, LayoutTemplate, Menu, X } from "lucide-react";
import { useState } from "react";
import type { AscendryRole } from "@/lib/ascendry-queries";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/ascendry/outreach",  label: "Outreach",  icon: BarChart2,   adminOnly: true  },
  { href: "/ascendry/pipeline",  label: "Pipeline",  icon: Kanban,      adminOnly: false },
  { href: "/ascendry/scripts",   label: "Scripts",   icon: BookOpen,       adminOnly: false },
  { href: "/ascendry/deck",      label: "Deck",      icon: LayoutTemplate, adminOnly: false },
  { href: "/ascendry/metrics",   label: "Metrics",   icon: TrendingUp,     adminOnly: false },
  { href: "/ascendry/revenue",   label: "Revenue",   icon: DollarSign,  adminOnly: true  },
  { href: "/ascendry/analysis",  label: "Analysis",  icon: FileText,    adminOnly: true  },
];

interface Props {
  role: AscendryRole;
  displayName: string;
}

export default function AscendrySidebar({ role, displayName }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || role === "admin");

  const NavContent = () => (
    <>
      {/* Header */}
      <div className="px-5 py-6 border-b border-[#1e2130]">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
            <span className="text-xs font-bold text-white">A</span>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">Ascendry</span>
        </div>
        <p className="text-xs text-zinc-500 pl-10">{displayName}</p>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 flex-1">
        <ul className="space-y-0.5">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100",
                    active
                      ? "bg-violet-600/15 text-violet-300 border border-violet-600/20"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                  )}
                >
                  <Icon size={16} className={active ? "text-violet-400" : "text-zinc-500"} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1e2130]">
        <Link
          href="/dashboard"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to ApexCard
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 flex-col bg-[#0d0e14] border-r border-[#1e2130] z-20">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0d0e14] border-b border-[#1e2130]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">A</span>
          </div>
          <span className="text-sm font-semibold text-white">Ascendry</span>
          <span className="text-xs text-zinc-500 ml-1">· {displayName}</span>
        </div>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-60 bg-[#0d0e14] border-r border-[#1e2130] h-full overflow-y-auto z-50">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
