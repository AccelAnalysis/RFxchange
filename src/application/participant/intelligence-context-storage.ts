export const PARTICIPANT_INTELLIGENCE_CONTEXT_STORAGE_KEY =
  "rfxchange:participant:intelligence-href";
export const PARTICIPANT_INTELLIGENCE_CONTEXT_CHANGED_EVENT =
  "rfxchange:participant:intelligence-href-changed";

function notifyIntelligenceContextChanged(): void {
  window.dispatchEvent(new Event(PARTICIPANT_INTELLIGENCE_CONTEXT_CHANGED_EVENT));
}

export function readParticipantIntelligenceContext(): string | null {
  try {
    return window.sessionStorage.getItem(PARTICIPANT_INTELLIGENCE_CONTEXT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeParticipantIntelligenceContext(href: string): void {
  try {
    window.sessionStorage.setItem(PARTICIPANT_INTELLIGENCE_CONTEXT_STORAGE_KEY, href);
    notifyIntelligenceContextChanged();
  } catch {
    // Optional browser UI state never grants authority and may fail closed when storage is unavailable.
  }
}

export function clearParticipantIntelligenceContext(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PARTICIPANT_INTELLIGENCE_CONTEXT_STORAGE_KEY);
    notifyIntelligenceContextChanged();
  } catch {
    // Session teardown continues even when optional browser UI storage is unavailable.
  }
}
