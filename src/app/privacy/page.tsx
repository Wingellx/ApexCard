import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — ApexCard",
  description: "How ApexCard collects, uses, and protects your personal information.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-[#f0f2f8] mb-3 tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm text-[#9ca3af] leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080a0e] text-[#f0f2f8]">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-[#4b5563] hover:text-[#9ca3af] transition-colors text-sm mb-8 group">
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to ApexCard
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-sm text-[#6b7280]">Effective date: January 1, 2025 · Last updated: April 2025</p>
        </div>

        <Section title="1. Information We Collect">
          <p>We collect information you provide directly when you create an account, including your name, email address, and username. When you use ApexCard, we collect performance data you log: call counts, show rates, close rates, cash collected, commission earned, and notes.</p>
          <p>We may also collect technical information automatically, such as your IP address, browser type, device identifiers, and usage data (pages visited, features used, timestamps). This data is used to operate and improve the service.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Provide, operate, and maintain the ApexCard service</li>
            <li>Personalize your dashboard, leaderboard visibility, and public stats card</li>
            <li>Process subscription payments and manage your account</li>
            <li>Send transactional emails (account changes, verification requests, billing)</li>
            <li>Detect fraud, enforce our Terms of Service, and comply with legal obligations</li>
            <li>Analyze aggregate usage patterns to improve the product</li>
          </ul>
          <p>We do not sell your personal data to third parties.</p>
        </Section>

        <Section title="3. Public Information">
          <p>If you set a username and opt into leaderboard visibility, your name, role, and performance stats will be publicly visible at <code className="text-[#d1d5db] bg-white/[0.06] px-1.5 py-0.5 rounded text-xs">apexcard.co/card/[username]</code> and on the public leaderboard. You can disable this at any time from your profile settings.</p>
          <p>Stats cards are visible to anyone with the link, even if leaderboard opt-in is disabled. You can make your card private by removing your username.</p>
        </Section>

        <Section title="4. Data Sharing">
          <p>We share your information only in the following circumstances:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-[#d1d5db]">Service providers:</strong> We use Supabase for database and authentication, and Stripe for payments. These providers process data on our behalf under their own privacy policies.</li>
            <li><strong className="text-[#d1d5db]">Verification requests:</strong> When you request manager verification, we send your stats summary and the manager&apos;s email to facilitate the verification. The manager receives a read-only summary.</li>
            <li><strong className="text-[#d1d5db]">Legal requirements:</strong> We may disclose information if required by law, court order, or to protect the rights and safety of ApexCard or others.</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>We retain your account data for as long as your account is active. If you delete your account, your profile, call logs, and goals are permanently deleted within 30 days. Aggregated, anonymized analytics data may be retained indefinitely.</p>
          <p>Billing records may be retained longer as required by law.</p>
        </Section>

        <Section title="6. Cookies and Tracking">
          <p>We use session cookies and local storage to keep you logged in and maintain your preferences. We do not use third-party advertising trackers. We may use privacy-respecting analytics tools to understand aggregate usage patterns.</p>
        </Section>

        <Section title="7. Security">
          <p>We implement industry-standard security measures including encrypted connections (TLS), hashed passwords, and row-level security on our database. However, no system is completely secure — you are responsible for maintaining the confidentiality of your login credentials.</p>
        </Section>

        <Section title="8. Your Rights">
          <p>Depending on your location, you may have rights under applicable privacy law (including GDPR and CCPA) to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Access, correct, or delete your personal data</li>
            <li>Export your data in a portable format (available via the Export Stats feature)</li>
            <li>Opt out of certain data uses</li>
            <li>Lodge a complaint with your local data protection authority</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:privacy@apexcard.co" className="text-indigo-400 hover:text-indigo-300 transition-colors">privacy@apexcard.co</a>.</p>
        </Section>

        <Section title="9. Children">
          <p>ApexCard is intended for users 18 years of age and older. We do not knowingly collect personal information from minors. If you believe a minor has created an account, contact us and we will delete it promptly.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by displaying a notice in the app. Continued use of ApexCard after changes take effect constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="11. Contact">
          <p>Questions about this Privacy Policy? Contact us at <a href="mailto:privacy@apexcard.co" className="text-indigo-400 hover:text-indigo-300 transition-colors">privacy@apexcard.co</a>.</p>
        </Section>

        <div className="border-t border-[#1e2130] pt-8 mt-4 flex items-center justify-between">
          <Link href="/terms" className="text-sm text-[#4b5563] hover:text-indigo-400 transition-colors font-medium">
            Terms of Service →
          </Link>
          <Link href="/" className="text-sm text-[#4b5563] hover:text-[#9ca3af] transition-colors">
            Back to ApexCard
          </Link>
        </div>

      </div>
    </div>
  );
}
