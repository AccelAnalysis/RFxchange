export type CommunicationChannel = "email" | "sms";
export type LifecycleJourney = "finish-setup" | "retention" | "win-back";
export interface CommunicationPreferences {
  userId: string; version: number; email: boolean; sms: boolean;
  marketingConsent: boolean; phone: string | null; timeZone: string;
  consentTextVersion: string; updatedAt: string;
}
export interface LifecycleState {
  userId: string; organizationId: string | null; active: boolean;
  accountAvailable: boolean; lastActivityAt: string; registeredAt: string;
}
export interface LifecyclePolicy {
  enabled: boolean; setupDelayHours: number; retentionDays: number; winBackDays: number; minimumIntervalHours: number;
}
export const DEFAULT_LIFECYCLE_POLICY: LifecyclePolicy = {
  enabled: false, setupDelayHours: 24, retentionDays: 14, winBackDays: 30, minimumIntervalHours: 168,
};
export const COMMUNICATION_CONSENT_VERSION = "rfxchange-communications-2026-09-12-v2";
export function validateLifecyclePolicy(input: unknown): LifecyclePolicy {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid lifecycle policy.");
  const p = input as Record<string, unknown>;
  if (typeof p.enabled !== "boolean") throw new Error("Enabled must be explicit.");
  for (const key of ["setupDelayHours", "retentionDays", "winBackDays", "minimumIntervalHours"] as const) {
    if (typeof p[key] !== "number" || !Number.isInteger(p[key]) || p[key] < 1 || p[key] > 8760) throw new Error("Invalid journey timing.");
  }
  if (Number(p.minimumIntervalHours) < 24 || Number(p.winBackDays) <= Number(p.retentionDays)) throw new Error("Invalid frequency or journey ordering.");
  return { enabled: p.enabled, setupDelayHours: Number(p.setupDelayHours), retentionDays: Number(p.retentionDays), winBackDays: Number(p.winBackDays), minimumIntervalHours: Number(p.minimumIntervalHours) };
}
export function chooseLifecycleJourney(state: LifecycleState, policy: LifecyclePolicy, now: number): LifecycleJourney | null {
  if (!state.accountAvailable) return null;
  const ageHours = (now - Date.parse(state.registeredAt)) / 3_600_000;
  const inactiveDays = (now - Date.parse(state.lastActivityAt)) / 86_400_000;
  if (!Number.isFinite(ageHours) || !Number.isFinite(inactiveDays)) return null;
  if (!state.active) return ageHours >= policy.setupDelayHours ? "finish-setup" : null;
  if (inactiveDays >= policy.winBackDays) return "win-back";
  return inactiveDays >= policy.retentionDays ? "retention" : null;
}
export function communicationSendDecision(input: {
  preferences: CommunicationPreferences | null; policy: LifecyclePolicy; state: LifecycleState;
  journey: LifecycleJourney; channel: CommunicationChannel; suppressed: boolean; lastSentAt: string | null; now: number;
}): string | null {
  const { preferences: p, policy, state, now } = input;
  if (!policy.enabled) return "journey-paused";
  if (!p || p.userId !== state.userId || !p.marketingConsent || p.consentTextVersion !== COMMUNICATION_CONSENT_VERSION) return "consent-required";
  if (!p[input.channel] || (input.channel === "sms" && !p.phone)) return "channel-disabled";
  if (input.suppressed) return "suppressed";
  if (chooseLifecycleJourney(state, policy, now) !== input.journey) return "journey-no-longer-applicable";
  if (input.lastSentAt && (!Number.isFinite(Date.parse(input.lastSentAt)) || now - Date.parse(input.lastSentAt) < policy.minimumIntervalHours * 3_600_000)) return "frequency-limit";
  if (!p.timeZone) return "time-zone-required";
  try {
    const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "2-digit", hourCycle: "h23", timeZone: p.timeZone }).format(now));
    if (hour < 9 || hour >= 20) return "quiet-hours";
  } catch { return "time-zone-required"; }
  return null;
}
