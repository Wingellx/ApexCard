"use client";

// Re-uses the same RequestCard logic as the manager panel but displayed in owner portal context.
// Owner can see all pending "owner"-type requests.

import ManagerVerificationPanel from "./ManagerVerificationPanel";
import type { RepVerificationRequestWithRep } from "@/lib/verification-queries";

export default function OwnerVerificationPanel({
  requests,
}: {
  requests: RepVerificationRequestWithRep[];
}) {
  return <ManagerVerificationPanel requests={requests} />;
}
