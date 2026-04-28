// ── Shared shell ─────────────────────────────────────────────────

function emailShell(body: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.apexcard.app";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#111318;border-radius:12px 12px 0 0;padding:24px 32px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="width:32px;height:32px;background:#6366f1;border-radius:8px;text-align:center;vertical-align:middle;">
                <span style="color:#fff;font-size:16px;font-weight:700;line-height:32px;">↗</span>
              </td>
              <td style="padding-left:10px;color:#f0f2f8;font-size:18px;font-weight:700;letter-spacing:-0.3px;vertical-align:middle;">ApexCard</td>
            </tr></table>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px 32px;">${body}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Sent by <a href="${appUrl}" style="color:#6366f1;text-decoration:none;">ApexCard</a> · Your verified sales identity
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string, color = "#6366f1"): string {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">${label}</a>`;
}

// ── Invite email ──────────────────────────────────────────────────

export function buildInviteEmail({
  teamName,
  shortCode,
  joinUrl,
  expiresAt,
}: {
  teamName:  string;
  shortCode: string;
  joinUrl:   string;
  expiresAt: string;
}): { subject: string; html: string } {
  const subject = `You've been invited to join ${teamName} on ApexCard`;
  const expiry  = new Date(expiresAt).toLocaleString("en-US", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">Team Invite</p>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0f172a;line-height:1.2;">You've been invited to join ${teamName}</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
      Click the button below or enter your invite code when you sign up.
    </p>

    <!-- Code card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:24px;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Your invite code</p>
        <p style="margin:0;font-size:32px;font-weight:800;color:#0f172a;letter-spacing:4px;font-family:monospace;">${shortCode}</p>
      </td></tr>
    </table>

    ${ctaButton(joinUrl, "Join " + teamName)}

    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
      This invite expires on ${expiry}. If you weren't expecting this, you can safely ignore it.
    </p>`;

  return { subject, html: emailShell(body) };
}

// ── Team approval email ───────────────────────────────────────────

export function buildTeamApprovalEmail({
  managerName,
  teamName,
  parentTeamName,
  approveUrl,
  declineUrl,
}: {
  managerName:    string;
  teamName:       string;
  parentTeamName: string;
  approveUrl:     string;
  declineUrl:     string;
}): { subject: string; html: string } {
  const subject = `${managerName} wants to create a new team: "${teamName}"`;

  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">New Team Request</p>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0f172a;line-height:1.2;">Team creation approval needed</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
      <strong style="color:#0f172a;">${managerName}</strong> wants to create a new sub-team under
      <strong style="color:#0f172a;">${parentTeamName}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:32px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Team Name</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:#0f172a;">${teamName}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Under: ${parentTeamName}</p>
      </td></tr>
    </table>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:12px;">${ctaButton(approveUrl, "✓ Approve", "#10b981")}</td>
        <td>${ctaButton(declineUrl, "✗ Decline", "#ef4444")}</td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">These links are one-use only. If you did not expect this email you can ignore it.</p>`;

  return { subject, html: emailShell(body) };
}

// ── Verification email ────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

interface VerificationEmailProps {
  managerName:    string;
  repName:        string;
  repEmail:       string;
  verifyUrl:      string;
  declineUrl:     string;
  startDate:      string;
  endDate:        string;
  stats: {
    cash:         number;
    commission:   number;
    calls:        number;
    offersTaken:  number;
    showRate:     number;
    closeRate:    number;
    cashPerClose: number;
    daysLogged:   number;
  };
}

export function buildVerificationEmail({
  managerName, repName, repEmail, verifyUrl, declineUrl,
  startDate, endDate, stats,
}: VerificationEmailProps): { subject: string; html: string } {
  const subject     = `${repName} has requested you verify their sales performance`;
  const periodLabel = `${fmtDate(startDate)} – ${fmtDate(endDate)}`;

  const body = `
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">Manager Verification Request</p>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0f172a;line-height:1.2;">
      ${repName} wants you to verify their sales performance
    </h1>
    <p style="margin:0 0 8px;font-size:15px;color:#64748b;line-height:1.6;">
      Hi ${managerName}, <strong style="color:#0f172a;">${repName}</strong> (${repEmail}) has listed you as their manager
      and is requesting verification of their sales performance through ApexCard.
    </p>
    <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.6;">
      You are being asked to verify <strong style="color:#0f172a;">${repName}</strong>'s performance
      from <strong style="color:#0f172a;">${fmtDate(startDate)}</strong> to <strong style="color:#0f172a;">${fmtDate(endDate)}</strong> only.
    </p>

    <!-- Date range badge -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 16px;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#1d4ed8;">📅 Performance period: ${periodLabel}</p>
        </td>
      </tr>
    </table>

    <!-- Stats card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:32px;">
      <tr><td style="padding:24px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Performance Summary</p>
        <p style="margin:0 0 20px;font-size:11px;color:#94a3b8;">${periodLabel}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="padding-bottom:16px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Cash Collected</p>
              <p style="margin:0;font-size:22px;font-weight:800;color:#10b981;">${fmt(stats.cash)}</p>
            </td>
            <td width="50%" style="padding-bottom:16px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Commission Earned</p>
              <p style="margin:0;font-size:22px;font-weight:800;color:#6366f1;">${fmt(stats.commission)}</p>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding-bottom:16px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Show Rate</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${stats.showRate.toFixed(1)}%</p>
            </td>
            <td width="50%" style="padding-bottom:16px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Close Rate</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${stats.closeRate.toFixed(1)}%</p>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding-bottom:4px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Calls Taken</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${stats.calls.toLocaleString()}</p>
            </td>
            <td width="50%" style="padding-bottom:4px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Deals Closed</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${stats.offersTaken.toLocaleString()}</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
      If you managed ${repName} during this period and can confirm these stats are accurate, click <strong>Verify Stats</strong>.
      If you don't recognise this request or the stats are inaccurate, click <strong>Decline</strong>.
    </p>
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:12px;">${ctaButton(verifyUrl, "✓ Verify Stats", "#10b981")}</td>
        <td>${ctaButton(declineUrl, "✗ Decline", "#ef4444")}</td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
      These links are unique to you and expire after use. If you did not expect this email, you can safely ignore it.
    </p>`;

  return { subject, html: emailShell(body) };
}

// ── Rep verification request to manager ──────────────────────────────────────

export function buildRepVerificationRequestEmail({
  managerName,
  repName,
  repEmail,
  stats,
  approveUrl,
  declineUrl,
}: {
  managerName: string;
  repName: string;
  repEmail: string;
  stats: { cash: number; calls: number; closed: number; closeRate: number; daysLogged: number };
  approveUrl: string;
  declineUrl: string;
}): { subject: string; html: string } {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const subject = `${repName} has requested verification from you — ApexCard`;

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">Verification Request</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${managerName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      <strong style="color:#111827;">${repName}</strong> (${repEmail}) has requested a verified badge on their ApexCard profile, and listed you as their manager.
    </p>
    <table cellpadding="12" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
      <tr>
        <td style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;" colspan="2">Their lifetime stats</td>
      </tr>
      <tr><td style="font-size:13px;color:#374151;">Total Revenue</td><td style="font-size:13px;font-weight:700;color:#111827;text-align:right;">${fmt(stats.cash)}</td></tr>
      <tr style="background:#fff;"><td style="font-size:13px;color:#374151;">Calls Taken</td><td style="font-size:13px;font-weight:700;color:#111827;text-align:right;">${stats.calls.toLocaleString()}</td></tr>
      <tr><td style="font-size:13px;color:#374151;">Deals Closed</td><td style="font-size:13px;font-weight:700;color:#111827;text-align:right;">${stats.closed.toLocaleString()}</td></tr>
      <tr style="background:#fff;"><td style="font-size:13px;color:#374151;">Close Rate</td><td style="font-size:13px;font-weight:700;color:#111827;text-align:right;">${stats.closeRate.toFixed(1)}%</td></tr>
      <tr><td style="font-size:13px;color:#374151;">Days Logged</td><td style="font-size:13px;font-weight:700;color:#111827;text-align:right;">${stats.daysLogged}</td></tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      If you managed ${repName} and can confirm their performance, click <strong>Approve</strong>. If you don't recognise this request, click <strong>Decline</strong>.
    </p>
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:12px;">${ctaButton(approveUrl, "✓ Approve", "#6366f1")}</td>
      <td>${ctaButton(declineUrl, "✗ Decline", "#ef4444")}</td>
    </tr></table>
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
      These links are unique to you. Clicking Approve will award ${repName} a verified badge on their public profile.
    </p>`;

  return { subject, html: emailShell(body) };
}

// ── Rep verification approved email ─────────────────────────────────────────

export function buildVerificationApprovedEmail({
  repName,
  approverName,
  profileUrl,
}: {
  repName: string;
  approverName: string;
  profileUrl: string;
}): { subject: string; html: string } {
  const subject = `You've been verified on ApexCard ✓`;

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">You're Verified 🎉</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${repName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      <strong style="color:#111827;">${approverName}</strong> has approved your verification request. A verified badge now appears on your public ApexCard profile.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#15803d;font-weight:600;">✓ Verification Active</p>
      <p style="margin:4px 0 0;font-size:13px;color:#374151;">Stay active — verification auto-pauses if you stop logging for 30+ days.</p>
    </div>
    ${ctaButton(profileUrl, "View my ApexCard →", "#6366f1")}`;

  return { subject, html: emailShell(body) };
}

// ── Rep verification declined email ─────────────────────────────────────────

export function buildVerificationDeclinedEmail({
  repName,
}: {
  repName: string;
}): { subject: string; html: string } {
  const subject = `Verification request update — ApexCard`;

  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;">Verification Request Declined</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${repName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
      Your verification request was reviewed and declined. You can submit a new request at any time from your ApexCard stats page.
    </p>
    <p style="margin:0;font-size:12px;color:#94a3b8;">If you believe this was a mistake, try requesting from a different manager or contact us.</p>`;

  return { subject, html: emailShell(body) };
}
