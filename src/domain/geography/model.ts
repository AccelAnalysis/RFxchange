import type { AccessJourneyId } from "../lifecycle/model.ts";
import type { UserId } from "../users/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type PrimaryOperatingGeographySelectionId = Brand<string, "PrimaryOperatingGeographySelectionId">;
export type LocalityId = Brand<string, "LocalityId">;
export type GeographyTimestamp = Brand<string, "GeographyTimestamp">;

export const LOCALITY_KINDS = [
  "city",
  "county",
  "independent-city",
  "town",
  "other-locality",
] as const;

export type LocalityKind = (typeof LOCALITY_KINDS)[number];

export interface SelectedPrimaryLocality {
  readonly id: LocalityId;
  readonly name: string;
  readonly kind: LocalityKind;
}

/**
 * GEO-001 records the user's primary operating locality choice during onboarding.
 * It is intentionally not an authoritative release/boundary record; GEO-002+ validate
 * the selection against server-owned geography metadata before controlled territory access.
 */
export interface PrimaryOperatingGeographySelection {
  readonly id: PrimaryOperatingGeographySelectionId;
  readonly userId: UserId;
  readonly accessJourneyId: AccessJourneyId;
  readonly locality: SelectedPrimaryLocality;
  readonly selectedAt: GeographyTimestamp;
  readonly updatedAt: GeographyTimestamp;
}

function required(value: string, field: string, max = 256): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  if (normalized.length > max) throw new Error(`${field} cannot exceed ${max} characters.`);
  return normalized;
}

function timestamp(value: string, field: string): GeographyTimestamp {
  const parsed = Date.parse(required(value, field, 64));
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString() as GeographyTimestamp;
}

export function localityId(value: string): LocalityId {
  const normalized = required(value, "Locality id", 192);
  if (normalized.includes("/")) throw new Error("Locality id cannot contain a slash.");
  return normalized as LocalityId;
}

export function localityKind(value: string): LocalityKind {
  const normalized = required(value, "Locality kind", 64).toLowerCase();
  if (!(LOCALITY_KINDS as readonly string[]).includes(normalized)) {
    throw new Error(`Unsupported locality kind: ${normalized}.`);
  }
  return normalized as LocalityKind;
}

export function primaryOperatingGeographySelectionId(
  userId: UserId,
): PrimaryOperatingGeographySelectionId {
  return `primary-${userId}` as PrimaryOperatingGeographySelectionId;
}

export function createPrimaryOperatingGeographySelection(input: Readonly<{
  userId: UserId;
  accessJourneyId: AccessJourneyId;
  localityId: string;
  localityName: string;
  localityKind: string;
  now: string;
  selectedAt?: string;
}>): PrimaryOperatingGeographySelection {
  const now = timestamp(input.now, "Primary operating geography update timestamp");
  return Object.freeze({
    id: primaryOperatingGeographySelectionId(input.userId),
    userId: input.userId,
    accessJourneyId: input.accessJourneyId,
    locality: Object.freeze({
      id: localityId(input.localityId),
      name: required(input.localityName, "Locality name", 180),
      kind: localityKind(input.localityKind),
    }),
    selectedAt: timestamp(input.selectedAt ?? input.now, "Primary operating geography selection timestamp"),
    updatedAt: now,
  });
}

export function revisePrimaryOperatingGeographySelection(
  current: PrimaryOperatingGeographySelection,
  input: Readonly<{
    localityId: string;
    localityName: string;
    localityKind: string;
    now: string;
  }>,
): PrimaryOperatingGeographySelection {
  return createPrimaryOperatingGeographySelection({
    userId: current.userId,
    accessJourneyId: current.accessJourneyId,
    localityId: input.localityId,
    localityName: input.localityName,
    localityKind: input.localityKind,
    now: input.now,
    selectedAt: current.selectedAt,
  });
}
