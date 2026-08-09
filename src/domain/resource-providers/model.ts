import type { OrganizationId, OrganizationProfileId } from "../organizations/model.ts";
import type { OrganizationLocationId, OrganizationServiceGeographyId } from "../organization-location/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type ProviderApplicationId = Brand<string, "ProviderApplicationId">;
export type ProviderApplicationEventId = Brand<string, "ProviderApplicationEventId">;
export type ProviderServiceProfileId = Brand<string, "ProviderServiceProfileId">;

export const PROVIDER_CATEGORIES = [
  "economic-development",
  "business-association",
  "capital-provider",
  "education-workforce",
  "government-assistance",
  "technical-assistance",
  "incubator-accelerator-coworking",
  "professional-support",
  "procurement-contracting-assistance",
  "other",
] as const;
export type ProviderCategory = (typeof PROVIDER_CATEGORIES)[number];

export const PROVIDER_MODALITIES = ["in-person", "virtual", "hybrid"] as const;
export type ProviderModality = (typeof PROVIDER_MODALITIES)[number];

export const PROVIDER_AVAILABILITY = ["unknown", "available", "limited", "unavailable"] as const;
export type ProviderAvailability = (typeof PROVIDER_AVAILABILITY)[number];

export const PROVIDER_APPLICATION_STATUSES = [
  "draft", "submitted", "under-review", "information-requested", "resubmitted", "approved", "denied",
] as const;
export type ProviderApplicationStatus = (typeof PROVIDER_APPLICATION_STATUSES)[number];

export interface ProviderServiceOffering {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly availability: ProviderAvailability;
  readonly capacityNote: string | null;
}

export interface ProviderContact {
  readonly displayName: string;
  readonly roleTitle: string;
  readonly email: string;
  readonly phone: string | null;
}

export interface ProviderApplicationContent {
  readonly categories: readonly ProviderCategory[];
  readonly otherCategoryDescription: string | null;
  readonly services: readonly ProviderServiceOffering[];
  readonly populationsServed: string;
  readonly eligibility: string;
  readonly intakeMethod: string;
  readonly modalities: readonly ProviderModality[];
  readonly languages: readonly string[];
  readonly officialContact: ProviderContact;
  readonly evidenceAssetIds: readonly string[];
  readonly authorityAttested: boolean;
}

export interface ProviderAuthoritativeReferences {
  readonly organizationId: OrganizationId;
  readonly profileId: OrganizationProfileId;
  readonly locationId: OrganizationLocationId;
  readonly serviceGeographyId: OrganizationServiceGeographyId;
  readonly sourceProfileUpdatedAt: string;
  readonly sourceLocationUpdatedAt: string;
  readonly sourceServiceGeographyUpdatedAt: string;
}

export interface ProviderActor {
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
}

export interface OfficialResourceProviderApplication {
  /** Stable current aggregate identity equals the organization id. */
  readonly id: ProviderApplicationId;
  readonly organizationId: OrganizationId;
  readonly applicationNumber: number;
  readonly status: ProviderApplicationStatus;
  readonly version: number;
  readonly references: ProviderAuthoritativeReferences;
  readonly content: ProviderApplicationContent;
  readonly applicant: ProviderActor;
  readonly informationRequest: string | null;
  readonly applicantResponse: string | null;
  readonly decisionReason: string | null;
  readonly decidedByAdministratorId: string | null;
  readonly submittedAt: string | null;
  readonly decidedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ProviderApplicationEventKind =
  | "draft-saved" | "submitted" | "review-started" | "information-requested"
  | "response-saved" | "resubmitted" | "approved" | "denied" | "service-profile-updated";

export interface ProviderApplicationEvent {
  readonly id: ProviderApplicationEventId;
  readonly applicationId: ProviderApplicationId;
  readonly organizationId: OrganizationId;
  readonly kind: ProviderApplicationEventKind;
  readonly fromStatus: ProviderApplicationStatus | null;
  readonly toStatus: ProviderApplicationStatus;
  readonly aggregateVersion: number;
  readonly actorKind: "participant" | "administrator";
  readonly actorId: string;
  readonly note: string | null;
  readonly commandId: string;
  readonly occurredAt: string;
}

export interface ProviderApplicationCommandReceipt {
  readonly id: string;
  readonly applicationId: ProviderApplicationId;
  readonly organizationId: OrganizationId;
  readonly action: ProviderApplicationEventKind;
  readonly requestFingerprint: string;
  readonly resultingVersion: number;
  readonly recordedAt: string;
}

export interface OfficialResourceProviderStatus {
  /** Stable singleton identity equals organization id. */
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly status: "official-resource-provider";
  readonly sourceApplicationId: ProviderApplicationId;
  readonly sourceApplicationVersion: number;
  readonly approvedAt: string;
  readonly approvedByAdministratorId: string;
}

export interface ProviderServiceProfile {
  /** Stable singleton identity equals organization id. */
  readonly id: ProviderServiceProfileId;
  readonly organizationId: OrganizationId;
  readonly sourceApplicationId: ProviderApplicationId;
  readonly sourceApplicationVersion: number;
  readonly version: number;
  readonly categories: readonly ProviderCategory[];
  readonly otherCategoryDescription: string | null;
  readonly services: readonly ProviderServiceOffering[];
  readonly populationsServed: string;
  readonly eligibility: string;
  readonly intakeMethod: string;
  readonly modalities: readonly ProviderModality[];
  readonly languages: readonly string[];
  readonly officialContact: ProviderContact;
  readonly serviceGeographyId: OrganizationServiceGeographyId;
  readonly availability: ProviderAvailability;
  readonly visibility: "owner-and-administrators";
  readonly status: "active";
  readonly updatedBy: ProviderActor;
  readonly updatedAt: string;
}

function required(value: string, label: string, maximum = 2000): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} exceeds ${maximum} characters.`);
  return normalized;
}

function optional(value: string | null | undefined, label: string, maximum = 2000): string | null {
  return value?.trim() ? required(value, label, maximum) : null;
}

function timestamp(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("Provider timestamp must be valid.");
  return new Date(parsed).toISOString();
}

function uniqueControlled<T extends string>(values: readonly string[], vocabulary: readonly T[], label: string): readonly T[] {
  const unique = [...new Set(values)];
  if (!unique.length || unique.some((value) => !vocabulary.includes(value as T))) throw new Error(`${label} contains an unsupported value.`);
  return Object.freeze(unique as T[]);
}

function contact(input: ProviderContact): ProviderContact {
  const email = required(input.email, "Official provider contact email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Official provider contact email is malformed.");
  return Object.freeze({
    displayName: required(input.displayName, "Official provider contact name", 160),
    roleTitle: required(input.roleTitle, "Official provider contact role", 120),
    email,
    phone: optional(input.phone, "Official provider contact phone", 40),
  });
}

function offerings(values: readonly ProviderServiceOffering[]): readonly ProviderServiceOffering[] {
  if (!values.length) throw new Error("At least one service or program is required.");
  const ids = new Set<string>();
  return Object.freeze(values.map((value) => {
    const id = required(value.id, "Service id", 191);
    if (ids.has(id)) throw new Error("Service ids must be unique.");
    ids.add(id);
    if (!PROVIDER_AVAILABILITY.includes(value.availability)) throw new Error("Service availability is unsupported.");
    return Object.freeze({ id, name: required(value.name, "Service name", 160), description: required(value.description, "Service description"), availability: value.availability, capacityNote: optional(value.capacityNote, "Capacity note", 500) });
  }));
}

export function providerApplicationContent(input: ProviderApplicationContent): ProviderApplicationContent {
  const categories = uniqueControlled(input.categories, PROVIDER_CATEGORIES, "Provider categories");
  const otherCategoryDescription = optional(input.otherCategoryDescription, "Other provider category", 500);
  if (categories.includes("other") && !otherCategoryDescription) throw new Error("Other provider category requires a description.");
  if (!input.authorityAttested) throw new Error("Authority attestation is required.");
  return Object.freeze({
    categories,
    otherCategoryDescription: categories.includes("other") ? otherCategoryDescription : null,
    services: offerings(input.services),
    populationsServed: required(input.populationsServed, "Organizations or populations served"),
    eligibility: required(input.eligibility, "Eligibility requirements"),
    intakeMethod: required(input.intakeMethod, "Intake or referral method"),
    modalities: uniqueControlled(input.modalities, PROVIDER_MODALITIES, "Provider modalities"),
    languages: Object.freeze([...new Set(input.languages.map((value) => required(value, "Supported language", 80)))]),
    officialContact: contact(input.officialContact),
    evidenceAssetIds: Object.freeze([...new Set(input.evidenceAssetIds.map((value) => required(value, "Evidence asset id", 191)))]),
    authorityAttested: true,
  });
}

export function createProviderApplication(input: Readonly<{
  organizationId: OrganizationId; references: ProviderAuthoritativeReferences; content: ProviderApplicationContent;
  applicant: ProviderActor; now: string; applicationNumber?: number;
}>): OfficialResourceProviderApplication {
  if (input.references.organizationId !== input.organizationId) throw new Error("Provider authoritative references belong to another organization.");
  const now = timestamp(input.now);
  return Object.freeze({ id: input.organizationId as unknown as ProviderApplicationId, organizationId: input.organizationId, applicationNumber: input.applicationNumber ?? 1, status: "draft", version: 1, references: Object.freeze({ ...input.references }), content: providerApplicationContent(input.content), applicant: Object.freeze({ ...input.applicant }), informationRequest: null, applicantResponse: null, decisionReason: null, decidedByAdministratorId: null, submittedAt: null, decidedAt: null, createdAt: now, updatedAt: now });
}

export function updateProviderDraft(input: Readonly<{ current: OfficialResourceProviderApplication; expectedVersion: number; references: ProviderAuthoritativeReferences; content: ProviderApplicationContent; applicant: ProviderActor; response?: string | null; now: string }>): OfficialResourceProviderApplication {
  if (input.current.version !== input.expectedVersion) throw new Error("Provider application changed; reload the current version.");
  if (!["draft", "information-requested"].includes(input.current.status)) throw new Error("This provider application cannot be edited in its current status.");
  if (input.references.organizationId !== input.current.organizationId) throw new Error("Provider authoritative references belong to another organization.");
  return Object.freeze({ ...input.current, references: Object.freeze({ ...input.references }), content: providerApplicationContent(input.content), applicant: Object.freeze({ ...input.applicant }), applicantResponse: input.current.status === "information-requested" ? required(input.response ?? "", "Information-request response") : null, version: input.current.version + 1, updatedAt: timestamp(input.now) });
}

const ADMIN_TRANSITIONS: Readonly<Record<"review-started" | "information-requested" | "approved" | "denied", readonly ProviderApplicationStatus[]>> = Object.freeze({
  "review-started": ["submitted", "resubmitted"],
  "information-requested": ["under-review"],
  approved: ["under-review", "resubmitted"],
  denied: ["under-review", "resubmitted"],
});

export function transitionProviderApplication(input: Readonly<{ current: OfficialResourceProviderApplication; expectedVersion: number; action: "submitted" | "resubmitted" | "review-started" | "information-requested" | "approved" | "denied"; now: string; note?: string | null; administratorId?: string | null }>): OfficialResourceProviderApplication {
  if (input.current.version !== input.expectedVersion) throw new Error("Provider application changed; reload the current version.");
  const now = timestamp(input.now);
  if (input.action === "submitted") {
    if (input.current.status !== "draft") throw new Error("Only a draft application can be submitted.");
    return Object.freeze({ ...input.current, status: "submitted", version: input.current.version + 1, submittedAt: now, updatedAt: now });
  }
  if (input.action === "resubmitted") {
    if (input.current.status !== "information-requested" || !input.current.applicantResponse) throw new Error("A response is required before resubmission.");
    return Object.freeze({ ...input.current, status: "resubmitted", version: input.current.version + 1, updatedAt: now });
  }
  if (!input.administratorId?.trim()) throw new Error("Administrator attribution is required.");
  if (!ADMIN_TRANSITIONS[input.action].includes(input.current.status)) throw new Error(`Provider application cannot transition from ${input.current.status} with ${input.action}.`);
  const status = input.action === "review-started" ? "under-review" : input.action === "information-requested" ? "information-requested" : input.action;
  const note = input.action === "review-started" ? null : required(input.note ?? "", input.action === "information-requested" ? "Information request" : "Decision reason", 2000);
  return Object.freeze({ ...input.current, status, version: input.current.version + 1, informationRequest: input.action === "information-requested" ? note : input.current.informationRequest, decisionReason: ["approved", "denied"].includes(input.action) ? note : input.current.decisionReason, decidedByAdministratorId: ["approved", "denied"].includes(input.action) ? input.administratorId.trim() : input.current.decidedByAdministratorId, decidedAt: ["approved", "denied"].includes(input.action) ? now : null, updatedAt: now });
}

export function createProviderServiceProfile(application: OfficialResourceProviderApplication, now: string): ProviderServiceProfile {
  if (application.status !== "approved") throw new Error("Only an approved application can create a provider service profile.");
  return Object.freeze({ id: application.organizationId as unknown as ProviderServiceProfileId, organizationId: application.organizationId, sourceApplicationId: application.id, sourceApplicationVersion: application.version, version: 1, categories: application.content.categories, otherCategoryDescription: application.content.otherCategoryDescription, services: application.content.services, populationsServed: application.content.populationsServed, eligibility: application.content.eligibility, intakeMethod: application.content.intakeMethod, modalities: application.content.modalities, languages: application.content.languages, officialContact: application.content.officialContact, serviceGeographyId: application.references.serviceGeographyId, availability: "unknown", visibility: "owner-and-administrators", status: "active", updatedBy: application.applicant, updatedAt: timestamp(now) });
}

export function updateProviderServiceProfile(input: Readonly<{
  current: ProviderServiceProfile;
  expectedVersion: number;
  categories: readonly ProviderCategory[];
  otherCategoryDescription: string | null;
  services: readonly ProviderServiceOffering[];
  populationsServed: string;
  eligibility: string;
  intakeMethod: string;
  modalities: readonly ProviderModality[];
  languages: readonly string[];
  officialContact: ProviderContact;
  serviceGeographyId: OrganizationServiceGeographyId;
  availability: ProviderAvailability;
  actor: ProviderActor;
  now: string;
}>): ProviderServiceProfile {
  if (input.current.version !== input.expectedVersion) throw new Error("Provider service profile changed; reload the current version.");
  if (!PROVIDER_AVAILABILITY.includes(input.availability)) throw new Error("Provider availability is unsupported.");
  const normalized = providerApplicationContent({
    categories: input.categories,
    otherCategoryDescription: input.otherCategoryDescription,
    services: input.services,
    populationsServed: input.populationsServed,
    eligibility: input.eligibility,
    intakeMethod: input.intakeMethod,
    modalities: input.modalities,
    languages: input.languages,
    officialContact: input.officialContact,
    evidenceAssetIds: [],
    authorityAttested: true,
  });
  return Object.freeze({ ...input.current, version: input.current.version + 1, categories: normalized.categories, otherCategoryDescription: normalized.otherCategoryDescription, services: normalized.services, populationsServed: normalized.populationsServed, eligibility: normalized.eligibility, intakeMethod: normalized.intakeMethod, modalities: normalized.modalities, languages: normalized.languages, officialContact: normalized.officialContact, serviceGeographyId: input.serviceGeographyId, availability: input.availability, updatedBy: Object.freeze({ ...input.actor }), updatedAt: timestamp(input.now) });
}
