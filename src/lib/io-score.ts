export const IO_TEAM_ID = "00000000-0000-0000-0000-000000000010";
export const IO_INVITE_CODE = "IO-2026";

// Baseline work units for full work score (25 pts)
const DAILY_BASELINE = 15;   // calls per day
const WEEKLY_BASELINE = 75;  // calls (or hours*2) per week

export interface ScoreBreakdown {
  total: number;           // 0–100
  work: number;            // 0–25
  fitness: number;         // 0–35
  accountability: number;  // 0–40
}

export function computeScore(
  workUnits: number,
  workoutCompleted: boolean,
  goalCompleted: boolean,
  focusRating: number,
  trackingPreference: "daily" | "weekly"
): ScoreBreakdown {
  const baseline = trackingPreference === "daily" ? DAILY_BASELINE : WEEKLY_BASELINE;
  const work           = Math.round(Math.min(workUnits / baseline, 1) * 25);
  const fitness        = workoutCompleted ? 35 : 0;
  const accountability = Math.round((goalCompleted ? 20 : 0) + (focusRating / 10) * 20);
  return { total: work + fitness + accountability, work, fitness, accountability };
}

export function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-400";
  if (score >= 65) return "text-amber-400";
  return "text-rose-400";
}

export function scoreBg(score: number): string {
  if (score >= 85) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 65) return "bg-amber-500/10 border-amber-500/20";
  return "bg-rose-500/10 border-rose-500/20";
}

export function scoreLabel(score: number): string {
  if (score >= 90) return "Elite";
  if (score >= 80) return "High";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  return "Low";
}

// Get the check-in date key for a given tracker type
export function getCheckinDateKey(pref: "daily" | "weekly"): string {
  const today = new Date();
  if (pref === "daily") {
    return today.toISOString().split("T")[0];
  }
  // Weekly: use Monday of current week
  const day = today.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

export function getCurrentWeekMonday(): string {
  return getCheckinDateKey("weekly");
}

// Day labels for training split
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_FULL   = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function todayDayOfWeek(): number {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 7 : d; // 1=Mon … 7=Sun
}
