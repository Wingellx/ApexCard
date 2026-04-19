export type UserRole = "closer" | "setter" | "operator";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface CallLog {
  id: string;
  user_id: string;
  date: string;
  calls_taken: number;
  shows: number;
  offers_made: number;
  offers_taken: number;
  cash_collected: number;
  commission_earned: number;
  notes?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  period: "daily" | "weekly" | "monthly";
  calls_target: number;
  show_rate_target: number;
  close_rate_target: number;
  cash_target: number;
  commission_target: number;
  created_at: string;
}

export interface DashboardMetrics {
  callsTaken: number;
  shows: number;
  offersMade: number;
  offersTaken: number;
  cashCollected: number;
  commissionEarned: number;
  showRate: number;
  closeRate: number;
}
