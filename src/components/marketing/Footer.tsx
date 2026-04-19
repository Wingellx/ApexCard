import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#1e2130] bg-[#0a0b0f]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <img src="/logo.svg" alt="ApexCard" className="w-8 h-8" />
              <span className="font-bold text-lg tracking-tight">ApexCard</span>
            </Link>
            <p className="text-[#6b7280] text-sm max-w-xs leading-relaxed">
              Your verified sales identity. Track what matters, get verified, and share your performance card.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4">Product</p>
            <ul className="space-y-2.5">
              {["Features", "Pricing", "Changelog"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-[#6b7280] hover:text-[#f0f2f8] transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4">Legal</p>
            <ul className="space-y-2.5">
              {["Privacy Policy", "Terms of Service"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-sm text-[#6b7280] hover:text-[#f0f2f8] transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-[#1e2130] mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6b7280]">© {new Date().getFullYear()} ApexCard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
