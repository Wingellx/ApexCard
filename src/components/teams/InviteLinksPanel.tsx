import { Link2 } from "lucide-react";
import CopyLinkButton from "./CopyLinkButton";

const APP_URL = "https://www.apexcard.app";

type Props = {
  ownerToken:   string | null;
  managerToken: string | null;
  memberToken:  string | null;
  /** Role of the viewer in team_members — controls which links are visible */
  viewerRole:   string;
};

export default function InviteLinksPanel({
  ownerToken,
  managerToken,
  memberToken,
  viewerRole,
}: Props) {
  const canSeeElevated = viewerRole === "offer_owner" || viewerRole === "admin";

  const rows: { label: string; sublabel: string; token: string | null }[] = [
    ...(canSeeElevated ? [
      { label: "Owner Invite",   sublabel: "Joins as Offer Owner",   token: ownerToken   },
      { label: "Manager Invite", sublabel: "Joins as Sales Manager", token: managerToken },
    ] : []),
    { label: "Member Invite", sublabel: "Joins as Member", token: memberToken },
  ];

  return (
    <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl overflow-hidden">
      <div className="border-b border-[#1e2130] px-5 py-4 flex items-center gap-2">
        <Link2 className="w-3.5 h-3.5 text-indigo-400" />
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Invite Links</p>
      </div>

      <div className="p-4 space-y-4">
        {rows.map(row => (
          <div key={row.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="shrink-0">
              <p className="text-sm font-semibold text-[#f0f2f8]">{row.label}</p>
              <p className="text-[11px] text-[#4b5563]">{row.sublabel}</p>
            </div>
            {row.token ? (
              <CopyLinkButton url={`${APP_URL}/join/${row.token}`} />
            ) : (
              <span className="text-xs text-[#374151] italic">Run migration to generate</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
