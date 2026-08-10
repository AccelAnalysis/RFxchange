const COMMAND_RECORD_VERSION = 1 as const;
const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const COMMAND_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/;

export interface CommandStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface RetryStableCommandRecord {
  readonly version: typeof COMMAND_RECORD_VERSION;
  readonly fingerprint: string;
  readonly commandId: string;
  readonly createdAt: number;
  readonly attemptedAt: number | null;
}

function parsedRecord(value: string | null): RetryStableCommandRecord | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<RetryStableCommandRecord>;
    if (
      parsed.version !== COMMAND_RECORD_VERSION ||
      typeof parsed.fingerprint !== "string" ||
      typeof parsed.commandId !== "string" ||
      !COMMAND_PATTERN.test(parsed.commandId) ||
      typeof parsed.createdAt !== "number" ||
      !Number.isFinite(parsed.createdAt) ||
      (parsed.attemptedAt !== undefined && parsed.attemptedAt !== null &&
        (typeof parsed.attemptedAt !== "number" || !Number.isFinite(parsed.attemptedAt)))
    ) {
      return null;
    }
    return Object.freeze({
      version: COMMAND_RECORD_VERSION,
      fingerprint: parsed.fingerprint,
      commandId: parsed.commandId,
      createdAt: parsed.createdAt,
      attemptedAt: parsed.attemptedAt ?? null,
    });
  } catch {
    return null;
  }
}

function recordIsCurrent(
  record: RetryStableCommandRecord,
  fingerprint: string,
  now: number,
  maximumAgeMs: number,
): boolean {
  return record.fingerprint === fingerprint &&
    record.createdAt <= now &&
    now - record.createdAt <= maximumAgeMs;
}

/**
 * Returns one participant command identity for one exact reviewed input. Session storage is only a
 * retry aid; server-side authorization, fingerprint comparison, and transactional replay remain
 * authoritative. Storage failure degrades to in-page retry rather than blocking the operation.
 */
export function resolveRetryStableCommand(input: Readonly<{
  storage: CommandStorage | null;
  storageKey: string;
  fingerprint: string;
  prefix: string;
  randomId?: () => string;
  now?: () => number;
  maximumAgeMs?: number;
}>): string {
  const now = (input.now ?? Date.now)();
  const maximumAgeMs = input.maximumAgeMs ?? DEFAULT_MAX_AGE_MS;
  if (input.storage) {
    try {
      const existing = parsedRecord(input.storage.getItem(input.storageKey));
      if (existing && recordIsCurrent(existing, input.fingerprint, now, maximumAgeMs)) {
        return existing.commandId;
      }
    } catch {
      // Session storage is a recovery enhancement and cannot grant authority.
    }
  }

  const randomId = input.randomId ? input.randomId() : crypto.randomUUID();
  const commandId = `${input.prefix}-${randomId}`;
  if (!COMMAND_PATTERN.test(commandId)) {
    throw new Error("Generated participant command identity is invalid.");
  }
  if (input.storage) {
    try {
      input.storage.setItem(input.storageKey, JSON.stringify({
        version: COMMAND_RECORD_VERSION,
        fingerprint: input.fingerprint,
        commandId,
        createdAt: now,
        attemptedAt: null,
      } satisfies RetryStableCommandRecord));
    } catch {
      // The active component still retains the returned command identity for in-page retry.
    }
  }
  return commandId;
}

export function clearRetryStableCommand(input: Readonly<{
  storage: CommandStorage | null;
  storageKey: string;
  commandId?: string | null;
}>): void {
  if (!input.storage) return;
  try {
    if (input.commandId) {
      const existing = parsedRecord(input.storage.getItem(input.storageKey));
      if (existing && existing.commandId !== input.commandId) return;
    }
    input.storage.removeItem(input.storageKey);
  } catch {
    // Clearing optional retry state must not affect the authoritative operation.
  }
}

export function shouldClearRetryStableCommandOnReviewBack(input: Readonly<{
  submissionAttempted: boolean;
}>): boolean {
  return !input.submissionAttempted;
}

export function markRetryStableCommandAttempted(input: Readonly<{
  storage: CommandStorage | null;
  storageKey: string;
  commandId: string;
  now?: () => number;
}>): void {
  if (!input.storage) return;
  try {
    const existing = parsedRecord(input.storage.getItem(input.storageKey));
    if (!existing || existing.commandId !== input.commandId) return;
    input.storage.setItem(input.storageKey, JSON.stringify({
      ...existing,
      attemptedAt: (input.now ?? Date.now)(),
    } satisfies RetryStableCommandRecord));
  } catch {
    // Attempt metadata improves reload recovery but never grants operation authority.
  }
}

export function retryStableCommandWasAttempted(input: Readonly<{
  storage: CommandStorage | null;
  storageKey: string;
  commandId: string;
}>): boolean {
  if (!input.storage) return false;
  try {
    const existing = parsedRecord(input.storage.getItem(input.storageKey));
    return existing?.commandId === input.commandId && existing.attemptedAt !== null;
  } catch {
    return false;
  }
}
