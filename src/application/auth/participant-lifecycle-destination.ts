import type { AccessLifecycleRecord } from "../../domain/lifecycle/model.ts";

export function participantLifecycleDestination(
  lifecycleState: AccessLifecycleRecord["state"],
  organizationId: string | null,
  orientationComplete: boolean,
): string | null {
  if (!organizationId) return null;
  if (lifecycleState === "open-platform") return "/exchange";
  if (lifecycleState !== "controlled-platform") return null;
  return orientationComplete ? "/first-value" : "/orientation";
}
