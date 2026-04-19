import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service — ApexCard",
  description: "The terms and conditions governing your use of ApexCard.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-[#f0f2f8] mb-3 tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm text-[#9ca3af] leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080a0e] text-[#f0f2f8]">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-[#4b5563] hover:text-[#9ca3af] transition-colors text-sm mb-8 group">
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to ApexCard
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
          </div>
          <p className="text-sm text-[#6b7280]">Effective date: January 1, 2025 · Last updated: April 2025</p>
        </div>

        <p className="text-sm text-[#9ca3af] leading-relaxed mb-10">
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of ApexCard (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By creating an account or using the service, you agree to these Terms. If you do not agree, do not use ApexCard.
        </p>

        <Section title="1. Eligibility">
          <p>You must be at least 18 years old to use ApexCard. By creating an account, you represent that you meet this requirement and that all information you provide is accurate and current.</p>
        </Section>

        <Section title="2. Your Account">
          <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at <a href="mailto:support@apexcard.co" className="text-indigo-400 hover:text-indigo-300 transition-colors">support@apexcard.co</a> if you suspect unauthorized access.</p>
          <p>You may not create multiple accounts, share your account with others, or use another person&apos;s account without their permission.</p>
        </Section>

        <Section title="3. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Submit false, misleading, or fabricated performance data</li>
            <li>Impersonate any person or misrepresent your affiliation with any company</li>
            <li>Attempt to gain unauthorized access to any part of the service or other users&apos; accounts</li>
            <li>Use the service for any unlawful purpose or in violation of any applicable laws or regulations</li>
            <li>Scrape, crawl, or systematically extract data from the service without written permission</li>
            <li>Interfere with or disrupt the integrity or performance of the service</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these rules without prior notice.</p>
        </Section>

        <Section title="4. Subscriptions and Billing">
          <p>Some features of ApexCard require a paid subscription. Subscription fees are charged in advance on a monthly or annual basis. All fees are non-refundable except as required by law or as described in our refund policy.</p>
          <p>We reserve the right to change our pricing with at least 14 days&apos; notice. Continued use of the service after a price change takes effect constitutes acceptance of the new price.</p>
          <p>Payments are processed by Stripe. Your payment information is stored and processed by Stripe and is subject to their terms and privacy policy. We do not store full card details.</p>
          <p>If your payment fails, we will attempt to collect payment for up to 7 days before suspending your account. You can update your payment method from your account settings at any time.</p>
        </Section>

        <Section title="5. Cancellation">
          <p>You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period — you retain access to paid features until then. We do not provide prorated refunds for partial billing periods.</p>
          <p>To delete your account entirely, use the &ldquo;Delete Account&rdquo; option in Settings. Deletion is permanent and removes all your data.</p>
        </Section>

        <Section title="6. Public Content and Stats Cards">
          <p>By enabling a public username and stats card, you grant ApexCard a non-exclusive, royalty-free license to display your submitted performance data publicly at your card URL and on the leaderboard. You can revoke this at any time by disabling leaderboard opt-in or removing your username.</p>
          <p>You are solely responsible for the accuracy of data on your public stats card. ApexCard does not independently verify self-reported stats. The verification badge reflects that a named manager confirmed accuracy — it is not a guarantee by ApexCard.</p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>ApexCard and its content, features, and functionality are owned by us and are protected by copyright, trademark, and other intellectual property laws. You retain ownership of the performance data you submit.</p>
          <p>You may not copy, modify, distribute, sell, or lease any part of the ApexCard service without our written permission.</p>
        </Section>

        <Section title="8. Disclaimers">
          <p>ApexCard is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or free of viruses or other harmful components.</p>
          <p>Performance data is self-reported. We make no representations regarding the accuracy of any stats displayed on the platform.</p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>To the fullest extent permitted by law, ApexCard shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service. Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
        </Section>

        <Section title="10. Indemnification">
          <p>You agree to indemnify and hold harmless ApexCard and its officers, directors, and employees from any claims, damages, or expenses (including legal fees) arising from your use of the service, your violation of these Terms, or your violation of any third-party rights.</p>
        </Section>

        <Section title="11. Governing Law">
          <p>These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Delaware, and you consent to personal jurisdiction there.</p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p>We may update these Terms from time to time. When we make material changes, we will notify you by email or by displaying a notice in the app at least 14 days before the changes take effect. Continued use of ApexCard after changes take effect constitutes acceptance of the new Terms.</p>
        </Section>

        <Section title="13. Contact">
          <p>Questions about these Terms? Contact us at <a href="mailto:legal@apexcard.co" className="text-indigo-400 hover:text-indigo-300 transition-colors">legal@apexcard.co</a>.</p>
        </Section>

        <div className="border-t border-[#1e2130] pt-8 mt-4 flex items-center justify-between">
          <Link href="/privacy" className="text-sm text-[#4b5563] hover:text-indigo-400 transition-colors font-medium">
            Privacy Policy →
          </Link>
          <Link href="/" className="text-sm text-[#4b5563] hover:text-[#9ca3af] transition-colors">
            Back to ApexCard
          </Link>
        </div>

      </div>
    </div>
  );
}
