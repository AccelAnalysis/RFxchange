const PREVIEW_STORAGE_KEY = "accelpo-preview-organization-v2";
const ROLE_OPTIONS = Object.freeze([
  Object.freeze({ key: "organization-admin", label: "Admin" }),
  Object.freeze({ key: "power-user-manager", label: "Manager" }),
  Object.freeze({ key: "contributor", label: "Member" }),
  Object.freeze({ key: "viewer", label: "Viewer" }),
  Object.freeze({ key: "billing-manager", label: "Finance" }),
]);

const DEFAULT_PREVIEW = Object.freeze({
  context: Object.freeze({
    organizationId: "preview-workspace",
    displayName: "Your organization",
    membershipId: "preview-owner",
    membershipStatus: "active",
    permissions: Object.freeze([
      "organization.profile.manage",
      "organization.people.manage",
      "purchasing.configure",
      "purchase.budget.view",
    ]),
    plan: Object.freeze({ name: "Preview plan", billingPeriod: null }),
    seats: Object.freeze({
      included: 3,
      active: 3,
      reserved: 0,
      available: 0,
      addOnAllowance: 0,
      addOnPricing: null,
      addSeatActionAllowed: true,
      entitlementVersion: "preview-entitlement-v1",
      ownerCountsAsSeat: true,
    }),
  }),
  details: Object.freeze({ country: "United States" }),
  people: Object.freeze([
    Object.freeze({ kind: "person", id: "preview-owner", displayName: "You", email: null, status: "active", accessSummary: "Owner" }),
    Object.freeze({ kind: "person", id: "preview-approver", displayName: "Jordan Lee", email: null, status: "active", accessSummary: "Approver" }),
    Object.freeze({ kind: "person", id: "preview-buyer", displayName: "Team member", email: null, status: "active", accessSummary: "Buyer" }),
  ]),
  providers: Object.freeze([
    Object.freeze({ id: "northstar", name: "Northstar Office Supply", category: "Workplace", fulfillmentMethod: "Delivery", active: true }),
    Object.freeze({ id: "harbor-safety", name: "Harbor Safety Group", category: "Services", fulfillmentMethod: "Remote", active: true }),
  ]),
  budgets: Object.freeze([]),
  configuration: Object.freeze({
    departments: Object.freeze(["General"]),
    approvalSummary: "Organization rules determine who reviews each purchase.",
    budgetTracking: "Optional",
    evidenceSummary: "Set evidence requirements by purchase context.",
    purchasingPreference: "Allow existing providers and RFxchange community sourcing.",
  }),
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function previewState() {
  try {
    const stored = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Session storage is an enhancement only for the static preview.
  }
  return clone(DEFAULT_PREVIEW);
}

let preview = previewState();

function savePreview() {
  try {
    sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(preview));
  } catch {
    // Keep the current in-memory preview usable when storage is unavailable.
  }
}

function appElement() {
  return document.querySelector("#app");
}

export function isPreviewMode() {
  return appElement()?.dataset.preview === "true";
}

function apiBase() {
  const configured = appElement()?.dataset.apiBase?.trim();
  return configured ? configured.replace(/\/$/, "") : "";
}

async function post(path, body) {
  const response = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error || payload?.message || "The action could not be completed.");
    error.code = payload?.code || "unavailable-service";
    error.details = payload?.details || null;
    throw error;
  }
  return payload;
}

/** CP-04 role-safe browser read. CP-01 remains the server authority for actor and active organization. */
export async function readProjection(projection, scope = "list", options = {}) {
  return post("/api/accelpo/query", {
    organizationId: options.organizationId ?? null,
    query: {
      projection,
      scope,
      ...(options.recordId ? { recordId: options.recordId } : {}),
      ...(options.filters ? { filters: options.filters } : {}),
      ...(options.limit ? { limit: options.limit } : {}),
    },
  });
}

/** CP-03 trusted command write. Actor authority is intentionally absent from the browser payload. */
export async function executeCommand(commandName, organizationId, payload, options = {}) {
  const requestId = options.requestId || `org-${crypto.randomUUID()}`;
  return post("/api/accelpo/commands", {
    commandName,
    organizationContext: { organizationId },
    payload,
    ...(options.expectedVersion !== undefined ? { expectedVersion: options.expectedVersion } : {}),
    ...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
    requestId,
  });
}

function projectionItems(result, expected) {
  if (!result || result.outcome === "failure") {
    const error = new Error(result?.message || "This information is temporarily unavailable.");
    error.code = result?.code || "unavailable-service";
    throw error;
  }
  if (result.projection !== expected) {
    const error = new Error("The requested organization information was not returned.");
    error.code = "invalid-projection";
    throw error;
  }
  return result.items || [];
}

export async function loadOrganizationContext() {
  if (isPreviewMode()) return clone(preview.context);
  const items = projectionItems(await readProjection("organization-context", "record"), "organization-context");
  if (!items[0]) throw new Error("Organization context is unavailable.");
  return items[0];
}

export async function loadPeopleAndSeats() {
  if (isPreviewMode()) {
    return { context: clone(preview.context), people: clone(preview.people), roles: clone(ROLE_OPTIONS) };
  }
  const context = await loadOrganizationContext();
  const people = projectionItems(
    await readProjection("people-invitations", "list", { organizationId: context.organizationId, limit: 100 }),
    "people-invitations",
  );
  return { context, people, roles: clone(ROLE_OPTIONS) };
}

export async function loadProviders() {
  if (isPreviewMode()) return { context: clone(preview.context), providers: clone(preview.providers) };
  const context = await loadOrganizationContext();
  const providers = projectionItems(
    await readProjection("provider-summary", "list", { organizationId: context.organizationId, limit: 100 }),
    "provider-summary",
  );
  return { context, providers };
}

export async function loadPurchasingConfiguration() {
  if (isPreviewMode()) {
    return {
      context: clone(preview.context),
      configuration: clone(preview.configuration),
      budgets: clone(preview.budgets),
      providers: clone(preview.providers),
    };
  }
  const context = await loadOrganizationContext();
  const [budgetsResult, providersResult] = await Promise.all([
    readProjection("budget-summary", "list", { organizationId: context.organizationId, limit: 50 }),
    readProjection("provider-summary", "list", { organizationId: context.organizationId, limit: 50 }),
  ]);
  return {
    context,
    configuration: null,
    budgets: projectionItems(budgetsResult, "budget-summary"),
    providers: projectionItems(providersResult, "provider-summary"),
  };
}

export async function saveOrganizationDetails(input) {
  if (!isPreviewMode()) {
    const error = new Error("Shared organization profile editing is not connected to an AccelPO command yet.");
    error.code = "profile-write-unavailable";
    throw error;
  }
  const displayName = String(input.displayName || "").trim();
  const country = String(input.country || "").trim();
  if (!displayName) throw new Error("Organization name is required.");
  preview.context.displayName = displayName;
  preview.details.country = country || "United States";
  savePreview();
  return { context: clone(preview.context), details: clone(preview.details) };
}

export async function savePurchasingConfiguration(input) {
  if (!isPreviewMode()) {
    const error = new Error("Purchasing configuration writes require the P2 server command definitions.");
    error.code = "policy-write-unavailable";
    throw error;
  }
  preview.configuration = {
    ...preview.configuration,
    departments: String(input.departments || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    approvalSummary: String(input.approvalSummary || "").trim(),
    budgetTracking: String(input.budgetTracking || "Optional").trim(),
    evidenceSummary: String(input.evidenceSummary || "").trim(),
    purchasingPreference: String(input.purchasingPreference || "").trim(),
  };
  savePreview();
  return clone(preview.configuration);
}

export async function addProvider(input) {
  if (!isPreviewMode()) {
    const error = new Error("Provider configuration writes require the P2 server command definitions.");
    error.code = "provider-write-unavailable";
    throw error;
  }
  const name = String(input.name || "").trim();
  if (!name) throw new Error("Provider name is required.");
  const provider = {
    id: `preview-provider-${Date.now()}`,
    name,
    category: String(input.category || "").trim() || null,
    fulfillmentMethod: String(input.fulfillmentMethod || "").trim() || null,
    active: true,
  };
  preview.providers.push(provider);
  savePreview();
  return clone(provider);
}

export async function invitePerson(input) {
  const email = String(input.email || "").trim().toLowerCase();
  const roleBundleKey = String(input.roleBundleKey || "viewer").trim();
  if (!email || !email.includes("@")) throw new Error("Enter a valid email address.");

  if (isPreviewMode()) {
    const seats = preview.context.seats;
    if ((seats.available ?? 0) <= 0) {
      const error = new Error("No seats are currently available for another invitation.");
      error.code = "seat-capacity-exhausted";
      error.details = { addSeatActionAllowed: Boolean(seats.addSeatActionAllowed), availableSeats: 0 };
      throw error;
    }
    const role = ROLE_OPTIONS.find((candidate) => candidate.key === roleBundleKey) || ROLE_OPTIONS.at(-1);
    const invitation = {
      kind: "invitation",
      id: `preview-inv-${Date.now()}`,
      email,
      status: "pending",
      accessSummary: role?.label || "Member",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    preview.people.push(invitation);
    preview.context.seats.reserved += 1;
    preview.context.seats.available = Math.max(0, preview.context.seats.available - 1);
    preview.context.seats.addSeatActionAllowed = preview.context.seats.available === 0;
    savePreview();
    return clone(invitation);
  }

  const context = await loadOrganizationContext();
  const requestId = `invite-${crypto.randomUUID()}`;
  return executeCommand(
    "entitlement.invitation.create",
    context.organizationId,
    {
      email,
      roleBundleKey,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { requestId, idempotencyKey: requestId },
  );
}

export async function revokeInvitation(invitationId) {
  if (isPreviewMode()) {
    const invitation = preview.people.find((item) => item.kind === "invitation" && item.id === invitationId);
    if (!invitation || invitation.status !== "pending") throw new Error("The invitation is unavailable.");
    invitation.status = "revoked";
    preview.context.seats.reserved = Math.max(0, preview.context.seats.reserved - 1);
    preview.context.seats.available = (preview.context.seats.available ?? 0) + 1;
    preview.context.seats.addSeatActionAllowed = false;
    savePreview();
    return clone(invitation);
  }
  const context = await loadOrganizationContext();
  const requestId = `revoke-${crypto.randomUUID()}`;
  return executeCommand(
    "entitlement.invitation.revoke",
    context.organizationId,
    { invitationId },
    { requestId, idempotencyKey: requestId },
  );
}

export async function deactivateMembership(membershipId) {
  if (isPreviewMode()) {
    const error = new Error("Member removal stays blocked in preview until open responsibilities can be checked safely.");
    error.code = "responsibility-check-unavailable";
    throw error;
  }
  const context = await loadOrganizationContext();
  const requestId = `deactivate-${crypto.randomUUID()}`;
  return executeCommand(
    "entitlement.membership.deactivate",
    context.organizationId,
    { membershipId },
    { requestId, idempotencyKey: requestId },
  );
}

/**
 * CP-10 defines a billing handoff, not a payment transaction. This helper deliberately produces
 * only the handoff facts. The preview can simulate capacity after the user explicitly chooses the
 * preview-only action, but no real subscription or payment state is changed.
 */
export async function createAddSeatHandoff() {
  const context = await loadOrganizationContext();
  const seats = context.seats;
  if (!seats.addSeatActionAllowed || !context.plan?.name || !seats.entitlementVersion) return null;
  return {
    kind: "add-seat",
    organizationId: context.organizationId,
    quantity: 1,
    plan: context.plan.name,
    entitlementVersion: seats.entitlementVersion,
    returnTo: "/organization/people",
    quotedUnitPrice: seats.addOnPricing || null,
  };
}

export function applyPreviewSeatExpansion() {
  if (!isPreviewMode()) return null;
  preview.context.seats.addOnAllowance += 1;
  preview.context.seats.available = (preview.context.seats.available ?? 0) + 1;
  preview.context.seats.addSeatActionAllowed = false;
  savePreview();
  return clone(preview.context);
}

export function previewDetails() {
  return isPreviewMode() ? clone(preview.details) : { country: null };
}

export function roleOptions() {
  return clone(ROLE_OPTIONS);
}
