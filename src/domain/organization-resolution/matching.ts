import type {
  OrganizationDiscoveryRecord,
  OrganizationIdentityInput,
  OrganizationMatchCandidate,
  OrganizationMatchEvidence,
} from "./model.ts";
import {
  normalizeGovernmentIdentifier,
  normalizeOrganizationAddress,
  normalizeOrganizationDomain,
  normalizeOrganizationIdentity,
  normalizeOrganizationName,
  normalizeOrganizationPhone,
} from "./model.ts";
import type { OrganizationId } from "../organizations/model.ts";

function evidence(
  kind: OrganizationMatchEvidence["kind"],
  strength: OrganizationMatchEvidence["strength"],
  explanation: string,
  score: number,
): OrganizationMatchEvidence {
  return Object.freeze({ kind, strength, explanation, score });
}

function normalizedAddressKey(
  address: NonNullable<OrganizationIdentityInput["address"]>,
): string {
  const value = normalizeOrganizationAddress(address);
  return [
    normalizeOrganizationName(value.line1),
    normalizeOrganizationName(value.locality),
    value.region,
    value.postalCode ?? "",
    value.countryCode,
  ].join("|");
}

function tokenSimilarity(left: string, right: string): number {
  const leftTokens = new Set(normalizeOrganizationName(left).split(" "));
  const rightTokens = new Set(normalizeOrganizationName(right).split(" "));
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function governmentIdentifierKeys(
  identity: OrganizationIdentityInput,
): readonly string[] {
  return Object.freeze(
    (identity.governmentIdentifiers ?? []).map((value) => {
      const normalized = normalizeGovernmentIdentifier(value);
      return `${normalized.jurisdiction}:${normalized.scheme}:${normalized.value}`;
    }),
  );
}

function recordIdentity(record: OrganizationDiscoveryRecord): OrganizationIdentityInput {
  return Object.freeze({
    displayName: record.displayName.value,
    aliases: Object.freeze(record.aliases.map((value) => value.value)),
    categories: Object.freeze(record.categories.map((value) => value.value)),
    ...(record.geographyId ? { geographyId: record.geographyId.value } : {}),
    ...(record.address ? { address: record.address.value } : {}),
    ...(record.domain ? { domain: record.domain.value } : {}),
    ...(record.phone ? { phone: record.phone.value } : {}),
    governmentIdentifiers: Object.freeze(
      record.governmentIdentifiers.map((value) => value.value),
    ),
  });
}

function compareOrganizationIdentity(
  provisionalInput: OrganizationIdentityInput,
  record: OrganizationDiscoveryRecord,
): readonly OrganizationMatchEvidence[] {
  const provisional = normalizeOrganizationIdentity(provisionalInput);
  const candidate = normalizeOrganizationIdentity(recordIdentity(record));
  const matched: OrganizationMatchEvidence[] = [];
  const provisionalGovernmentIds = new Set(governmentIdentifierKeys(provisional));
  const governmentMatch = governmentIdentifierKeys(candidate).some((key) =>
    provisionalGovernmentIds.has(key),
  );
  if (governmentMatch) {
    matched.push(
      evidence(
        "government-identifier",
        "definitive",
        "An authoritative identifier matches.",
        100,
      ),
    );
  }

  if (
    provisional.domain &&
    candidate.domain &&
    normalizeOrganizationDomain(provisional.domain) ===
      normalizeOrganizationDomain(candidate.domain)
  ) {
    matched.push(evidence("domain", "strong", "Organization domain matches.", 45));
  }
  if (
    provisional.phone &&
    candidate.phone &&
    normalizeOrganizationPhone(provisional.phone) ===
      normalizeOrganizationPhone(candidate.phone)
  ) {
    matched.push(evidence("phone", "strong", "Organization phone matches.", 40));
  }
  if (
    provisional.address &&
    candidate.address &&
    normalizedAddressKey(provisional.address) === normalizedAddressKey(candidate.address)
  ) {
    matched.push(evidence("address", "strong", "Organization address matches.", 35));
  }

  const provisionalName = normalizeOrganizationName(provisional.displayName);
  const candidateName = normalizeOrganizationName(candidate.displayName);
  if (provisionalName === candidateName) {
    matched.push(
      evidence(
        "display-name",
        "strong",
        "Normalized organization name matches.",
        45,
      ),
    );
  } else {
    const aliasMatch = (candidate.aliases ?? []).some(
      (alias) => normalizeOrganizationName(alias) === provisionalName,
    );
    if (aliasMatch) {
      matched.push(
        evidence("alias", "strong", "Entered name matches a published alias.", 38),
      );
    } else if (tokenSimilarity(provisional.displayName, candidate.displayName) >= 0.6) {
      matched.push(
        evidence(
          "display-name",
          "supporting",
          "Organization names are similar and require participant review.",
          25,
        ),
      );
    }
  }

  if (
    provisional.geographyId &&
    candidate.geographyId &&
    provisional.geographyId === candidate.geographyId
  ) {
    matched.push(
      evidence("geography", "supporting", "Primary operating locality matches.", 10),
    );
  }
  return Object.freeze(matched);
}

function publicCandidate(
  record: OrganizationDiscoveryRecord,
  evidenceValues: readonly OrganizationMatchEvidence[],
): OrganizationMatchCandidate | null {
  if (evidenceValues.length === 0) return null;
  const score = evidenceValues.reduce((total, item) => total + item.score, 0);
  const definitive = evidenceValues.some((item) => item.strength === "definitive");
  const nameEvidence = evidenceValues.some(
    (item) => item.kind === "display-name" || item.kind === "alias",
  );
  const strongEvidenceCount = evidenceValues.filter(
    (item) => item.strength === "strong",
  ).length;
  const classification =
    definitive && !nameEvidence
      ? "identity-conflict"
      : definitive || score >= 70 || (nameEvidence && strongEvidenceCount >= 2)
        ? "likely-match"
        : score >= 25
          ? "possible-match"
          : null;
  if (!classification) return null;

  const publicAddress =
    record.address?.visibility === "public" ? record.address.value : undefined;
  return Object.freeze({
    organizationId: record.organizationId,
    profileId: record.profileId,
    displayName: record.displayName.value,
    origin: record.origin,
    classification,
    score,
    evidence: Object.freeze([...evidenceValues]),
    publicCategories: Object.freeze(
      record.categories
        .filter((value) => value.visibility === "public")
        .map((value) => value.value),
    ),
    ...(record.geographyId?.visibility === "public"
      ? { publicGeographyId: record.geographyId.value }
      : {}),
    ...(publicAddress
      ? { publicLocality: publicAddress.locality, publicRegion: publicAddress.region }
      : {}),
    claimAction: Object.freeze({
      label: "This is my organization" as const,
      organizationId: record.organizationId,
    }),
  });
}

export function matchOrganizations(
  provisional: OrganizationIdentityInput,
  records: readonly OrganizationDiscoveryRecord[],
): readonly OrganizationMatchCandidate[] {
  return Object.freeze(
    records
      .map((record) =>
        publicCandidate(record, compareOrganizationIdentity(provisional, record)),
      )
      .filter(
        (candidate): candidate is OrganizationMatchCandidate => candidate !== null,
      )
      .sort(
        (left, right) =>
          right.score - left.score ||
          left.displayName.localeCompare(right.displayName) ||
          left.organizationId.localeCompare(right.organizationId),
      ),
  );
}

export type OrganizationCreationSafety =
  | Readonly<{ readonly allowed: true }>
  | Readonly<{
      readonly allowed: false;
      readonly reason: "identity-conflict" | "unreviewed-likely-match";
      readonly organizationIds: readonly OrganizationId[];
    }>;

export function evaluateOrganizationCreationSafety(
  candidates: readonly OrganizationMatchCandidate[],
  reviewedOrganizationIds: readonly OrganizationId[],
): OrganizationCreationSafety {
  const conflicts = candidates
    .filter((candidate) => candidate.classification === "identity-conflict")
    .map((candidate) => candidate.organizationId);
  if (conflicts.length > 0) {
    return Object.freeze({
      allowed: false as const,
      reason: "identity-conflict" as const,
      organizationIds: Object.freeze(conflicts),
    });
  }

  const reviewed = new Set(reviewedOrganizationIds);
  const unreviewed = candidates
    .filter(
      (candidate) =>
        candidate.classification === "likely-match" &&
        !reviewed.has(candidate.organizationId),
    )
    .map((candidate) => candidate.organizationId);
  if (unreviewed.length > 0) {
    return Object.freeze({
      allowed: false as const,
      reason: "unreviewed-likely-match" as const,
      organizationIds: Object.freeze(unreviewed),
    });
  }
  return Object.freeze({ allowed: true as const });
}
