import type { RfxPackageInput } from "./model.ts";

/**
 * RFx Slice 4.2 monetary catalog projected from the pinned AMACS 0.5.0
 * `currency` unit family in `src/generated/amacs/0.5.0/registries.json`.
 *
 * Keep this projection release-bound: RFx must not accept a currency merely
 * because it is syntactically three letters or supported by a payment SDK.
 */
export const RFX_ISS006_GOVERNED_CURRENCY_CODES = Object.freeze([
  "USD",
  "EUR",
  "GBP",
  "CAD",
] as const);

const GOVERNED_CURRENCY_CODES = new Set<string>(RFX_ISS006_GOVERNED_CURRENCY_CODES);

export class RfxIss006GovernanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RfxIss006GovernanceError";
  }
}

function objectValue(value: unknown): Readonly<Record<string, unknown>> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : null;
}

function governedCurrency(value: unknown): void {
  if (typeof value !== "string") return;
  const normalized = value.trim().toUpperCase();
  if (!GOVERNED_CURRENCY_CODES.has(normalized)) {
    throw new RfxIss006GovernanceError(
      `Estimated value currency ${normalized || "(blank)"} is not supported by the governed AMACS 0.5.0 currency catalog.`,
    );
  }
}

function milestoneChronology(value: unknown): void {
  const term = objectValue(value);
  if (!term || term.mode !== "milestone-based") return;

  const start = typeof term.expectedStart === "string" ? term.expectedStart.trim() : "";
  const completion =
    typeof term.expectedCompletion === "string" ? term.expectedCompletion.trim() : "";

  // The canonical package normalizer owns date-shape validation. This bounded
  // guard adds the missing temporal relationship only after both date-shaped
  // values are present, so malformed values still fail at the canonical path.
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(start) &&
    /^\d{4}-\d{2}-\d{2}$/.test(completion) &&
    start > completion
  ) {
    throw new RfxIss006GovernanceError(
      "Milestone expected completion cannot precede expected start.",
    );
  }
}

/**
 * Adds the two ISS-006 structured-value checks missing from the original Slice
 * 4.2 implementation. Normalization, range checks and ordinary date validation
 * remain owned by `normalizeRfxPackage`.
 */
export function assertRfxIss006StructuredValueAuthority(
  input: Pick<RfxPackageInput, "estimatedValue" | "engagementTerm">,
): void {
  const estimatedValue = objectValue(input.estimatedValue);
  if (
    estimatedValue &&
    (estimatedValue.mode === "exact" || estimatedValue.mode === "range")
  ) {
    governedCurrency(estimatedValue.currency);
  }
  milestoneChronology(input.engagementTerm);
}
