"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface Stats {
  name: string;
  role?: string | null;
  isVerified?: boolean;
  verifiedByName?: string | null;
  verifiedByCompany?: string | null;
  cash: number;
  commission: number;
  calls: number;
  offersMade: number;
  offersTaken: number;
  shows: number;
  showRate: number;
  closeRate: number;
  cashPerClose: number;
  bestDay: number;
  daysLogged: number;
  streak?: number;
}

const ROLE_LABELS: Record<string, string> = {
  closer:   "Closer",
  setter:   "Appointment Setter",
  operator: "Growth Operator",
  manager:  "Sales Manager",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n);
}
function fmtK(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return fmt(n);
}

function drawCard(ctx: CanvasRenderingContext2D, s: Stats) {
  const W = 1080, H = 1080;
  const PAD = 80;

  // ── Background ──────────────────��───────────────────────────────
  ctx.fillStyle = "#080910";
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow
  const glow = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.7);
  glow.addColorStop(0, "rgba(139,92,246,0.06)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Top accent line ──────────────────────────────────────────────
  const line = ctx.createLinearGradient(0, 0, W, 0);
  line.addColorStop(0,   "rgba(109,40,217,0.6)");
  line.addColorStop(0.3, "rgba(139,92,246,1)");
  line.addColorStop(0.6, "rgba(99,102,241,0.9)");
  line.addColorStop(1,   "rgba(109,40,217,0.6)");
  ctx.fillStyle = line;
  ctx.fillRect(0, 0, W, 3);

  let y = PAD;

  // ── Header row ─────────────────────────────���─────────────────────
  ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(139,92,246,0.5)";
  ctx.letterSpacing = "4px";
  ctx.fillText("APEXCARD", PAD, y + 20);
  ctx.letterSpacing = "0px";

  if (s.isVerified) {
    const badgeW = 110, badgeH = 30, bx = W - PAD - badgeW, by = y;
    ctx.fillStyle = "rgba(16,185,129,0.1)";
    ctx.strokeStyle = "rgba(16,185,129,0.25)";
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, badgeW, badgeH, 15, true, true);
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#10b981";
    ctx.fillText("✓  VERIFIED", bx + 20, by + 20);
  }

  y += 60;
  divider(ctx, PAD, y, W - PAD * 2);
  y += 24;

  // ── Identity ─────────────────────────────────────────────────────
  const nameSize = s.name.length > 20 ? 58 : s.name.length > 14 ? 68 : 80;
  ctx.font = `900 ${nameSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(s.name, PAD, y + nameSize * 0.82);
  y += nameSize + 12;

  const roleLabel = s.role ? (ROLE_LABELS[s.role] ?? s.role) : null;
  if (roleLabel) {
    ctx.font = "600 22px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(107,114,128,0.9)";
    ctx.fillText(roleLabel, PAD, y);
    y += 36;
  }

  y += 20;
  divider(ctx, PAD, y, W - PAD * 2);
  y += 44;

  // ── Hero: Lifetime Cash ───────────────────────────────────────────
  ctx.font = "900 14px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(16,185,129,0.5)";
  ctx.letterSpacing = "4px";
  ctx.fillText("LIFETIME CASH COLLECTED", PAD, y);
  ctx.letterSpacing = "0px";
  y += 20;

  ctx.font = `900 ${s.cash >= 1_000_000 ? 100 : 118}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#10b981";
  ctx.shadowColor = "rgba(16,185,129,0.3)";
  ctx.shadowBlur = 60;
  ctx.fillText(fmtK(s.cash), PAD, y + 100);
  ctx.shadowBlur = 0;
  y += 124;

  ctx.font = "500 20px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(75,85,99,0.9)";
  ctx.fillText(`across ${s.calls.toLocaleString()} calls taken`, PAD, y);
  y += 44;

  divider(ctx, PAD, y, W - PAD * 2);
  y += 1;

  // ── 3-col strip: Show Rate | Close Rate | Cash/Close ─────────────
  const col3W = (W - PAD * 2) / 3;
  const col3H = 120;
  const cols3 = [
    { label: "SHOW RATE",    value: `${s.showRate.toFixed(1)}%`,   color: "#818cf8" },
    { label: "CLOSE RATE",   value: `${s.closeRate.toFixed(1)}%`,  color: "#a78bfa" },
    { label: "CASH / CLOSE", value: fmt(s.cashPerClose),           color: "#c4b5fd" },
  ];
  cols3.forEach(({ label, value, color }, i) => {
    const cx = PAD + i * col3W;
    if (i > 0) dividerV(ctx, cx, y, col3H);
    ctx.font = "900 12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(75,85,99,0.8)";
    ctx.letterSpacing = "3px";
    ctx.fillText(label, cx + 24, y + 36);
    ctx.letterSpacing = "0px";
    ctx.font = "800 36px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(value, cx + 24, y + 82);
  });
  y += col3H;

  divider(ctx, PAD, y, W - PAD * 2);
  y += 1;

  // ── 4-col grid: Calls | Offers | Closed | Commission ─────────────
  const col4W = (W - PAD * 2) / 4;
  const col4H = 120;
  const cols4 = [
    { label: "CALLS",      value: s.calls.toLocaleString(),       color: "#6366f1" },
    { label: "OFFERS",     value: s.offersMade.toLocaleString(),  color: "#f59e0b" },
    { label: "CLOSED",     value: s.offersTaken.toLocaleString(), color: "#10b981" },
    { label: "COMMISSION", value: fmtK(s.commission),             color: "#8b5cf6" },
  ];
  cols4.forEach(({ label, value, color }, i) => {
    const cx = PAD + i * col4W;
    if (i > 0) dividerV(ctx, cx, y, col4H);
    ctx.font = "900 11px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(75,85,99,0.8)";
    ctx.letterSpacing = "3px";
    ctx.fillText(label, cx + 20, y + 36);
    ctx.letterSpacing = "0px";
    ctx.font = "800 30px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(value, cx + 20, y + 82);
  });
  y += col4H;

  divider(ctx, PAD, y, W - PAD * 2);
  y += 1;

  // ── Best Day + Days Logged ────────────────────────────────────────
  const rowH = 110;
  ctx.font = "900 12px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(180,120,30,0.6)";
  ctx.letterSpacing = "3px";
  ctx.fillText("BEST SINGLE DAY", PAD + 20, y + 34);
  ctx.letterSpacing = "0px";
  ctx.font = "800 48px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#f59e0b";
  ctx.fillText(fmt(s.bestDay), PAD + 20, y + 88);

  dividerV(ctx, W / 2, y, rowH);

  ctx.font = "900 12px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(75,85,99,0.6)";
  ctx.letterSpacing = "3px";
  ctx.fillText("DAYS LOGGED", W / 2 + 24, y + 34);
  ctx.letterSpacing = "0px";
  ctx.font = "800 48px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#9ca3af";
  ctx.fillText(s.daysLogged.toLocaleString(), W / 2 + 24, y + 88);
  y += rowH;

  // ── Footer ────────────────────────────────────────────────────���───
  const footerY = H - PAD;
  ctx.font = "500 18px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(55,65,81,0.8)";
  const footerLeft = (s.streak && s.streak > 1)
    ? `🔥 ${s.streak}-day streak`
    : "apexcard.co";
  ctx.fillText(footerLeft, PAD, footerY);

  ctx.font = "900 14px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(139,92,246,0.7)";
  ctx.letterSpacing = "2px";
  const cta = "GET YOUR APEXCARD →";
  const ctaW = ctx.measureText(cta).width;
  ctx.fillText(cta, W - PAD - ctaW, footerY);
  ctx.letterSpacing = "0px";
}

function divider(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(x, y, w, 1);
}

function dividerV(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(x, y, 1, h);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill: boolean, stroke: boolean
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill)   ctx.fill();
  if (stroke) ctx.stroke();
}

export default function DownloadCardButton({ stats }: { stats: Stats }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width  = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d")!;
      drawCard(ctx, stats);
      const link = document.createElement("a");
      link.download = `apexcard-${stats.name.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] hover:text-[#f0f2f8] border border-[#1e2130] hover:border-[#2a2f45] px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      <Download className="w-3.5 h-3.5" />
      {loading ? "Generating…" : "Download Card"}
    </button>
  );
}
