import type { AccessLifecycleRecord } from "../../domain/lifecycle/model.ts";

export function participantLifecycleDestination(
  lifecycleState: AccessLifecycleRecord["state"],
  organizationId: string | null,
): string | null {
  if (!organizationId) return null;
  if (lifecycleState === "controlled-platform" || lifecycleState === "open-platform") {
    return "/exchange";
  }
  return null;
}
