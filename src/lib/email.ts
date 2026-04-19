const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface VerificationEmailProps {
  managerName: string;
  repName: string;
  repEmail: string;
  verifyUrl: string;
  declineUrl: string;
  stats: {
    cash: number;
    commission: number;
    calls: number;
    offersTaken: number;
    showRate: number;
    closeRate: number;
    cashPerClose: number;
    daysLogged: number;
  };
}

export function buildVerificationEmail({
  managerName, repName, repEmail, verifyUrl, declineUrl, stats,
}: VerificationEmailProps): { subject: string; html: string } {
  const subject = `${repName} has requested you verify their sales performance`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#111318;border-radius:12px 12px 0 0;padding:24px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:32px;height:32px;background:#6366f1;border-radius:8px;text-align:center;vertical-align:middle;">
                  <span style="color:#ffffff;font-size:16px;font-weight:700;line-height:32px;">↗</span>
                </td>
                <td style="padding-left:10px;color:#f0f2f8;font-size:18px;font-weight:700;letter-spacing:-0.3px;vertical-align:middle;">ApexCard</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px 32px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:1px;">Verification Request</p>
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0f172a;line-height:1.2;">
              ${repName} wants you to verify their sales stats
            </h1>
            <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.6;">
              Hi ${managerName}, <strong style="color:#0f172a;">${repName}</strong> (${repEmail}) has listed you as their manager
              and is requesting a verification of their sales performance through ApexCard.
            </p>

            <!-- Stats card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:32px;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 20px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Performance Summary</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%" style="padding-bottom:16px;vertical-align:top;">
                        <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Lifetime Cash</p>
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
                        <p style="margin:0 0 2px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Days Logged</p>
                        <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${stats.daysLogged}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
              If you managed ${repName} and can confirm these stats are accurate, click <strong>Verify</strong>.
              If you don&apos;t recognise this request or the stats are inaccurate, click <strong>Decline</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
              <tr>
                <td style="padding-right:12px;">
                  <a href="${verifyUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">
                    ✓ Verify Stats
                  </a>
                </td>
                <td>
                  <a href="${declineUrl}" style="display:inline-block;background:#f1f5f9;color:#64748b;font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:10px;">
                    Decline
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
              These links are unique to you and expire after use. If you did not expect this email, you can safely ignore it.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Sent by <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://apexcard.com"}" style="color:#6366f1;text-decoration:none;">ApexCard</a>
              · Your verified sales identity
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
