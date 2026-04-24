import { getCallRecords } from "@/lib/call-analysis-queries";
import CallRecordForm from "./CallRecordForm";
import CallRecordsTable from "./CallRecordsTable";
import { PhoneCall } from "lucide-react";

export default async function CallRecordsTab({ userId }: { userId: string }) {
  const records = await getCallRecords(userId);

  return (
    <div className="space-y-6">
      <CallRecordForm />

      <section>
        <div className="flex items-center gap-2 mb-3">
          <PhoneCall className="w-3.5 h-3.5 text-[#4b5563]" />
          <h2 className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest">
            Call Records
          </h2>
          <span className="ml-auto text-xs text-[#374151]">{records.length}</span>
        </div>
        <CallRecordsTable records={records} />
      </section>
    </div>
  );
}
