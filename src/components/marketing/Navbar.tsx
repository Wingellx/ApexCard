"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e2130] bg-[#0a0b0f]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img src="/logo.svg" alt="ApexCard" className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight text-[#f0f2f8]">ApexCard</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-[#6b7280] hover:text-[#f0f2f8] transition-colors">Features</Link>
          <Link href="#pricing" className="text-sm text-[#6b7280] hover:text-[#f0f2f8] transition-colors">Pricing</Link>
          <Link href="#testimonials" className="text-sm text-[#6b7280] hover:text-[#f0f2f8] transition-colors">Results</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Get started free</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
