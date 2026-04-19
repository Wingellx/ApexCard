// TEMP: preview route for Call History screenshot
import { History } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import CallHistoryTable from "@/components/dashboard/CallHistoryTable";

const logs = [
  { id: "1", date: "2026-04-18", calls_taken: 12, shows: 10, offers_made: 5, offers_taken: 3, cash_collected: 9200,  commission_earned: 1380, notes: null },
  { id: "2", date: "2026-04-17", calls_taken: 9,  shows: 7,  offers_made: 4, offers_taken: 2, cash_collected: 5800,  commission_earned: 870,  notes: null },
  { id: "3", date: "2026-04-16", calls_taken: 14, shows: 11, offers_made: 6, offers_taken: 4, cash_collected: 12200, commission_earned: 1830, notes: "Strong day — leads from Tuesday's webinar" },
  { id: "4", date: "2026-04-15", calls_taken: 8,  shows: 5,  offers_made: 3, offers_taken: 1, cash_collected: 3100,  commission_earned: 465,  notes: null },
  { id: "5", date: "2026-04-14", calls_taken: 11, shows: 9,  offers_made: 5, offers_taken: 3, cash_collected: 8700,  commission_earned: 1305, notes: null },
  { id: "6", date: "2026-04-11", calls_taken: 10, shows: 8,  offers_made: 4, offers_taken: 2, cash_collected: 6400,  commission_earned: 960,  notes: null },
  { id: "7", date: "2026-04-10", calls_taken: 13, shows: 10, offers_made: 5, offers_taken: 3, cash_collected: 9800,  commission_earned: 1470, notes: null },
];

export default function PreviewHistoryPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] flex">
      <Sidebar userName="Preview" userEmail="" userRole="Closer" userInitial="P" streak={0} />
      <div className="ml-60 px-8 py-8 w-full max-w-[1400px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Call History</h1>
              <p className="text-sm text-[#6b7280] mt-0.5">7 entries · $55,200 lifetime cash</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg">
            + Log Today
          </button>
        </div>
        <CallHistoryTable logs={logs} />
      </div>
    </div>
  );
}
