"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PhoneCall, Target, History, Award,
  Settings, LogOut, Menu, X, Trophy, User, Flame, Users, Zap, Shield, Dumbbell, BarChart3, BookUser, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signout } from "@/app/auth/actions";

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: string;
  userInitial: string;
  streak: number;
  teamId?: string | null;
  isIOmember?: boolean;
  isTeamAdmin?: boolean;
  isCRMenabled?: boolean;
  role?: string | null;
}

function buildSections(teamId?: string | null, isIOmember?: boolean, isTeamAdmin?: boolean, isCRMenabled?: boolean, role?: string | null) {
  const isSetter = role === "setter";
  const isCloser = role === "closer";
  const useCRM   = isSetter || isCloser;
  return [
    {
      label: "Performance",
      items: [
        { href: "/dashboard",                              label: "Overview",    icon: LayoutDashboard },
        { href: useCRM ? "/dashboard/crm" : "/dashboard/log", label: useCRM ? "CRM" : "Log Calls", icon: useCRM ? BookUser : PhoneCall },
        { href: "/dashboard/history", label: "History",     icon: History         },
        { href: "/dashboard/goals",   label: "Goals",       icon: Target          },
        { href: "/dashboard/stats",   label: "My Stats",    icon: Award           },
      ],
    },
    {
      label: "Discover",
      items: [
        { href: "/leaderboard",             label: "Leaderboard", icon: Trophy  },
        { href: "/leaderboard/communities", label: "Rankings",    icon: BarChart3 },
        { href: "/offers",                  label: "Offer Board", icon: Briefcase },
        ...(teamId ? [
          { href: "/dashboard/team",          label: isIOmember ? "Brotherhood ⚔️" : "Team",     icon: Users    },
          { href: "/dashboard/team/training", label: "Training",                                  icon: Dumbbell },
          ...(isTeamAdmin ? [{ href: "/dashboard/team/admin", label: "Admin", icon: Shield }] : []),
        ] : []),
      ],
    },
    ...(isCRMenabled ? [{
      label: "CRM",
      items: [
        { href: "/dashboard/crm",         label: "My CRM",      icon: BookUser },
        ...(isTeamAdmin ? [{ href: "/dashboard/crm/manager", label: "Team View", icon: Shield }] : []),
      ],
    }] : []),
    ...(isIOmember ? [{
      label: "IO Community",
      items: [
        { href: "/dashboard/io",             label: "IO Dashboard", icon: Zap    },
        { href: "/dashboard/io/checkin",     label: "Debrief",      icon: Target },
        { href: "/dashboard/io/training",    label: "Training",     icon: Award  },
        { href: "/dashboard/io/leaderboard", label: "IO Board",     icon: Trophy },
        { href: "/dashboard/io/body",        label: "Body",         icon: Users  },
      ],
    }] : []),
    {
      label: "Account",
      items: [
        { href: "/dashboard/profile", label: "Profile",     icon: User            },
      ],
    },
  ];
}

export default function Sidebar({ userName, userEmail, userRole, userInitial, streak, teamId, isIOmember, isTeamAdmin, isCRMenabled, role }: SidebarProps) {
  const sections = buildSections(teamId, isIOmember, isTeamAdmin, isCRMenabled, role);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    if (href === "/dashboard/io") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  function UserInfo() {
    return (
      <div className="px-4 py-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/25 to-indigo-500/25 border border-violet-500/20 flex items-center justify-center shrink-0">
            <span className="text-[13px] font-bold text-violet-300">{userInitial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#e5e7eb] truncate leading-tight">{userName}</p>
            <p className="text-[11px] text-[#374151] truncate mt-0.5">{userRole}</p>
          </div>
        </div>
        {streak > 0 && (
          <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-500/[0.07] border border-orange-500/[0.12] rounded-lg w-fit">
            <Flame className="w-3 h-3 text-orange-400 shrink-0" />
            <span className="text-[11px] font-semibold text-orange-300/80">
              {streak} day streak
            </span>
          </div>
        )}
      </div>
    );
  }

  function NavContent() {
    return (
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="text-[9px] font-bold text-[#2d3147] uppercase tracking-[0.18em] px-2 mb-1.5">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                      active
                        ? "text-white bg-white/[0.07] shadow-[inset_2px_0_0_0_rgba(139,92,246,0.85)]"
                        : "text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      active ? "text-violet-400" : "text-[#2d3147]"
                    )} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  function BottomActions() {
    return (
      <div className="px-3 pb-5 pt-3 border-t border-white/[0.04] space-y-0.5 shrink-0">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
            isActive("/dashboard/settings")
              ? "text-white bg-white/[0.07] shadow-[inset_2px_0_0_0_rgba(139,92,246,0.85)]"
              : "text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.04]"
          )}
        >
          <Settings className={cn(
            "w-4 h-4 shrink-0",
            isActive("/dashboard/settings") ? "text-violet-400" : "text-[#2d3147]"
          )} />
          Settings
        </Link>
        <form action={signout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[#4b5563] hover:text-rose-400 hover:bg-rose-500/[0.05] transition-all duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0 text-[#2d3147]" />
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#0b0d12] border-r border-white/[0.04] flex-col z-40">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <img src="/logo.svg" alt="ApexCard" className="w-7 h-7" />
            <span className="font-bold text-[15px] tracking-tight text-[#f0f2f8]">ApexCard</span>
          </Link>
        </div>

        {/* User info */}
        <div className="border-t border-b border-white/[0.04] shrink-0">
          <UserInfo />
        </div>

        <NavContent />
        <BottomActions />
      </aside>

      {/* ── Mobile top bar ───────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0b0d12] border-b border-white/[0.04] flex items-center px-4 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/logo.svg" alt="ApexCard" className="w-7 h-7" />
          <span className="font-bold text-sm tracking-tight text-[#f0f2f8]">ApexCard</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="ml-auto p-2 text-[#4b5563] hover:text-[#9ca3af] transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Mobile overlay ───────────────────────────────── */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* ── Mobile drawer ────────────────────────────────── */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 h-screen w-72 bg-[#0b0d12] border-r border-white/[0.04] flex flex-col z-50",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-white/[0.04] shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" alt="ApexCard" className="w-7 h-7" />
            <span className="font-bold text-sm tracking-tight text-[#f0f2f8]">ApexCard</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto p-2 text-[#4b5563] hover:text-[#9ca3af] transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="border-b border-white/[0.04] shrink-0">
          <UserInfo />
        </div>

        <NavContent />
        <BottomActions />
      </aside>
    </>
  );
}
