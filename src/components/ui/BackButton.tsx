"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  href: string;
  label?: string;
}

export default function BackButton({ href, label = "Back" }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[#374151] hover:text-[#9ca3af] transition-colors group"
    >
      <ChevronLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
      {label}
    </Link>
  );
}
