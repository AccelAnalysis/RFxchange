import {
  addProvider,
  applyPreviewSeatExpansion,
  createAddSeatHandoff,
  deactivateMembership,
  invitePerson,
  isPreviewMode,
  loadOrganizationContext,
  loadPeopleAndSeats,
  loadProviders,
  loadPurchasingConfiguration,
  previewDetails,
  revokeInvitation,
  saveOrganizationDetails,
  savePurchasingConfiguration,
} from "./runtime.js";

const ACTION_ROUTES = Object.freeze({
  "edit-org": "organization/details",
  people: "organization/people",
  policy: "organization/purchasing",
  providers: "organization/providers",
  billing: "organization/billing",
});

const CHILD_ROUTES = new Set(Object.values(ACTION_ROUTES));
const app = document.querySelector("#app");

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
}[character]));

function currentHash() {
  return window.location.hash.replace(/^#\/?/, "") || "home";
}

function go(route) {
  const next = `#${route}`;
  if (window.location.hash === next) {
    void renderCurrentSurface();
    return;
  }
  window.location.hash = next;
}

function main() {
  return document.querySelector("#main-content");
}

function loading(title) {
  const target = main();
  if (!target) return;
  target.innerHTML = `<div class="page org-subpage"><button class="quiet-button org-back" data-org-route="organization">← Organization</button><div class="page-header"><div><p class="eyebrow">Organization</p><h1>${esc(title)}</h1><p class="page-subtitle">Loading your organization workspace…</p></div></div><section class="org-surface-card org-loading"><span></span><span></span><span></span></section></div>`;
}

function errorSurface(title, error) {
  const target = main();
  if (!target) return;
  const message = error?.message || "This organization information is temporarily unavailable.";
  target.innerHTML = `<div class="page org-subpage"><button class="quiet-button org-back" data-org-route="organization">← Organization</button><div class="page-header"><div><p class="eyebrow">Organization</p><h1>${esc(title)}</h1><p class="page-subtitle">${esc(message)}</p></div><button class="secondary-button" data-org-action="retry">Try again</button></div></div>`;
  activateOrganizationNav();
}

function pageHeader(title, subtitle, action = "") {
  return `<button class="quiet-button org-back" data-org-route="organization">← Organization</button><div class="page-header org-page-header"><div><p class="eyebrow">Organization</p><h1>${esc(title)}</h1><p class="page-subtitle">${esc(subtitle)}</p></div>${action}</div>`;
}

function permission(context, ...names) {
  const permissions = new Set(context?.permissions || []);
  return names.some((name) => permissions.has(name));
}

function seatLabel(context) {
  const seats = context?.seats;
  if (!seats || seats.active === null || seats.included === null) return "Seat information unavailable";
  const capacity = seats.included + (seats.addOnAllowance || 0);
  return `${seats.active} of ${capacity} seats in use${seats.reserved ? ` · ${seats.reserved} reserved` : ""}`;
}

function seatMeter(context) {
  const seats = context.seats;
  const capacity = Math.max(1, (seats.included || 0) + (seats.addOnAllowance || 0));
  const occupied = Math.min(capacity, (seats.active || 0) + (seats.reserved || 0));
  const percent = Math.round((occupied / capacity) * 100);
  return `<section class="org-surface-card seat-card"><div class="org-card-heading"><div><p class="eyebrow">Seat capacity</p><h2>${esc(seatLabel(context))}</h2></div><strong>${esc(`${seats.available ?? "—"} available`)}</strong></div><div class="seat-track" aria-label="${esc(`${percent}% of seat capacity in use`)}"><span style="width:${percent}%"></span></div><div class="seat-facts"><span><strong>${esc(seats.active ?? "—")}</strong> active</span><span><strong>${esc(seats.reserved ?? "—")}</strong> reserved</span><span><strong>${esc(seats.included ?? "—")}</strong> included</span>${seats.addOnAllowance ? `<span><strong>${esc(seats.addOnAllowance)}</strong> add-on</span>` : ""}</div><p class="org-helper">The organization owner counts as an active seat. Pending invitations reserve capacity until accepted, revoked, or expired.</p></section>`;
}

function renderDetails(context) {
  const target = main();
  if (!target) return;
  const details = previewDetails();
  const canManage = isPreviewMode() || permission(context, "organization.profile.manage");
  target.innerHTML = `<div class="page org-subpage">${pageHeader("Organization details", "Your AccelPO workspace uses the same organization identity as RFxchange.")}<section class="org-surface-card"><div class="org-card-heading"><div><p class="eyebrow">Shared identity</p><h2>${esc(context.displayName)}</h2></div><span class="org-status-chip">Active workspace</span></div><form class="org-form" data-org-form="details"><label class="field-label">Organization name<input class="text-input" name="displayName" value="${esc(context.displayName)}" ${canManage && isPreviewMode() ? "" : "readonly"} /></label><label class="field-label">Country<input class="text-input" name="country" value="${esc(details.country || "United States")}" ${isPreviewMode() ? "" : "readonly"} /></label><div class="org-inline-note"><strong>One organization identity</strong><span>Changes to the shared organization profile must use the existing RFxchange profile authority; AccelPO does not create a duplicate organization record.</span></div>${isPreviewMode() ? `<div class="form-footer"><span class="org-preview-note">Preview changes stay in this browser session.</span><button class="primary-button" type="submit">Save preview details</button></div>` : `<div class="form-footer"><span class="org-preview-note">Connected profile editing is read-only until the shared profile write is bound to this surface.</span></div>`}</form></section></div>`;
  activateOrganizationNav();
}

function personRow(item, canManage) {
  const isInvitation = item.kind === "invitation";
  const subtitle = isInvitation
    ? `${item.accessSummary || "Pending access"}${item.expiresAt ? ` · expires ${new Date(item.expiresAt).toLocaleDateString()}` : ""}`
    : `${item.accessSummary || "Member"}${item.email ? ` · ${item.email}` : ""}`;
  const actions = isInvitation && item.status === "pending" && canManage
    ? `<button class="quiet-button" data-org-action="revoke-invitation" data-invitation-id="${esc(item.id)}">Revoke</button>`
    : (!isInvitation && item.displayName !== "You" && canManage
      ? `<button class="quiet-button danger-text" data-org-action="remove-member" data-membership-id="${esc(item.id)}">Remove</button>`
      : "");
  return `<div class="member-row"><span class="member-avatar">${esc(isInvitation ? "✉" : (item.displayName || "?").slice(0, 1).toUpperCase())}</span><span class="member-copy"><strong>${esc(isInvitation ? item.email : item.displayName)}</strong><small>${esc(subtitle)}</small></span><span class="org-status-chip ${esc(item.status)}">${esc(item.status)}</span>${actions}</div>`;
}

function renderPeople(data, options = {}) {
  const target = main();
  if (!target) return;
  const { context, people, roles } = data;
  const canManage = isPreviewMode() || permission(context, "organization.people.manage", "purchase.people.manage");
  const noCapacity = (context.seats.available ?? 0) <= 0;
  const addSeat = noCapacity && Boolean(context.seats.addSeatActionAllowed);
  const action = canManage
    ? `<button class="primary-button" data-org-action="${addSeat ? "add-seat" : "show-invite"}">${addSeat ? "Add seat & invite" : "Invite person"}</button>`
    : "";
  const showInvite = options.showInvite && !noCapacity;
  target.innerHTML = `<div class="page org-subpage">${pageHeader("People & seats", "Manage who can use AccelPO and how seat capacity is consumed.", action)}${seatMeter(context)}${showInvite ? `<section class="org-surface-card invite-panel"><div class="org-card-heading"><div><p class="eyebrow">New invitation</p><h2>Invite a person</h2></div><button class="quiet-button" data-org-action="hide-invite">Cancel</button></div><form class="org-form" data-org-form="invite"><label class="field-label">Email address<input class="text-input" name="email" type="email" autocomplete="email" required placeholder="name@company.com" /></label><label class="field-label">Access template<select class="text-input" name="roleBundleKey">${roles.map((role) => `<option value="${esc(role.key)}">${esc(role.label)}</option>`).join("")}</select></label><div class="org-inline-note"><strong>Seat reservation</strong><span>Sending the invitation reserves one available seat until the invitation is accepted, revoked, or expires.</span></div><div class="form-footer"><button class="primary-button" type="submit">Send invitation</button></div></form></section>` : ""}<section class="org-surface-card"><div class="org-card-heading"><div><p class="eyebrow">Team</p><h2>Members & invitations</h2></div><span>${esc(`${people.filter((item) => item.kind === "person" && item.status === "active").length} active`)}</span></div><div class="member-list">${people.length ? people.map((item) => personRow(item, canManage)).join("") : `<div class="org-empty"><strong>No people to show</strong><span>Invite a team member when you are ready.</span></div>`}</div></section></div>`;
  activateOrganizationNav();
}

function renderPurchasing(data, savedMessage = "") {
  const target = main();
  if (!target) return;
  const { context, configuration, budgets, providers } = data;
  const canConfigure = isPreviewMode() || permission(context, "purchasing.configure", "purchase.configure");
  const liveReadOnly = !isPreviewMode();
  const departments = configuration?.departments?.join(", ") || "";
  const approval = configuration?.approvalSummary || "Configured rules are resolved for each purchase context.";
  const budgetTracking = configuration?.budgetTracking || (budgets.length ? `${budgets.length} budget record${budgets.length === 1 ? "" : "s"}` : "Not configured");
  const evidence = configuration?.evidenceSummary || "Evidence requirements are resolved from the active organization policy.";
  const preference = configuration?.purchasingPreference || "Existing-provider and community-sourcing behavior follows the active organization policy.";
  target.innerHTML = `<div class="page org-subpage">${pageHeader("Approval & spending", "Configure the organization rules that guide purchasing. AccelPO does not impose universal dollar thresholds.")} ${savedMessage ? `<div class="org-success-banner">${esc(savedMessage)}</div>` : ""}<section class="org-surface-card"><div class="org-card-heading"><div><p class="eyebrow">Purchasing configuration</p><h2>Organization rules</h2></div><span class="org-status-chip">${canConfigure ? "Configuration access" : "View only"}</span></div><form class="org-form" data-org-form="purchasing"><label class="field-label">Departments / cost areas<input class="text-input" name="departments" value="${esc(departments)}" placeholder="General, Operations, Sales" ${liveReadOnly ? "readonly" : ""}/><span>Comma-separated in this preview; production values remain organization-owned policy data.</span></label><label class="field-label">Approval routing<textarea class="text-input" name="approvalSummary" ${liveReadOnly ? "readonly" : ""}>${esc(approval)}</textarea></label><label class="field-label">Budget tracking<select class="text-input" name="budgetTracking" ${liveReadOnly ? "disabled" : ""}><option ${budgetTracking === "Optional" ? "selected" : ""}>Optional</option><option ${budgetTracking === "Enabled" ? "selected" : ""}>Enabled</option><option ${budgetTracking === "Not used" ? "selected" : ""}>Not used</option></select></label><label class="field-label">Evidence rules<textarea class="text-input" name="evidenceSummary" ${liveReadOnly ? "readonly" : ""}>${esc(evidence)}</textarea></label><label class="field-label">Purchasing preferences<textarea class="text-input" name="purchasingPreference" ${liveReadOnly ? "readonly" : ""}>${esc(preference)}</textarea></label><div class="org-config-grid"><button type="button" class="org-config-tile" data-org-route="organization/providers"><strong>Providers</strong><span>${esc(`${providers.length} configured`)}</span>→</button><div class="org-config-tile static"><strong>Budgets</strong><span>${esc(budgetTracking)}</span></div><div class="org-config-tile static"><strong>Approval policy</strong><span>Resolved per purchase</span></div><div class="org-config-tile static"><strong>Evidence policy</strong><span>Applied at closeout</span></div></div>${isPreviewMode() && canConfigure ? `<div class="form-footer"><span class="org-preview-note">Preview configuration is session-only and does not create policy history.</span><button class="primary-button" type="submit">Save preview configuration</button></div>` : `<div class="form-footer"><span class="org-preview-note">Current safe projections are shown here. Consequential policy edits remain unavailable until P2 server command definitions persist a versioned policy through CP-03.</span></div>`}</form></section></div>`;
  activateOrganizationNav();
}

function providerRow(provider) {
  return `<div class="provider-row"><span class="org-card-icon green">▤</span><span class="member-copy"><strong>${esc(provider.name)}</strong><small>${esc([provider.category, provider.fulfillmentMethod].filter(Boolean).join(" · ") || "Provider")}</small></span><span class="org-status-chip ${provider.active ? "active" : "inactive"}">${provider.active ? "Active" : "Inactive"}</span></div>`;
}

function renderProviders(data, showForm = false) {
  const target = main();
  if (!target) return;
  const canConfigure = isPreviewMode() || permission(data.context, "purchasing.configure", "purchase.configure");
  const action = canConfigure && isPreviewMode()
    ? `<button class="primary-button" data-org-action="${showForm ? "hide-provider" : "show-provider"}">${showForm ? "Cancel" : "Add provider"}</button>`
    : "";
  target.innerHTML = `<div class="page org-subpage">${pageHeader("Providers", "Keep the providers your organization already uses available to Purchase Cases.", action)}${showForm ? `<section class="org-surface-card"><div class="org-card-heading"><div><p class="eyebrow">New provider</p><h2>Add an existing provider</h2></div></div><form class="org-form" data-org-form="provider"><label class="field-label">Provider name<input class="text-input" name="name" required /></label><div class="form-row"><label class="field-label">Category<input class="text-input" name="category" placeholder="e.g. Workplace" /></label><label class="field-label">Fulfillment<input class="text-input" name="fulfillmentMethod" placeholder="e.g. Delivery" /></label></div><div class="form-footer"><button class="primary-button" type="submit">Add provider</button></div></form></section>` : ""}<section class="org-surface-card"><div class="org-card-heading"><div><p class="eyebrow">Existing providers</p><h2>${esc(`${data.providers.length} provider${data.providers.length === 1 ? "" : "s"}`)}</h2></div></div><div class="provider-list">${data.providers.length ? data.providers.map(providerRow).join("") : `<div class="org-empty"><strong>No providers yet</strong><span>Add a provider you already use or choose community sourcing from a Purchase Case.</span></div>`}</div>${!isPreviewMode() ? `<p class="org-helper">Provider reads use the role-safe organization projection. Provider writes remain unavailable until the P2 trusted command definitions are connected.</p>` : ""}</section></div>`;
  activateOrganizationNav();
}

function moneyMinor(pricing) {
  if (!pricing || typeof pricing.amountMinor !== "number") return null;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: pricing.currency }).format(pricing.amountMinor / 100);
  } catch {
    return `${pricing.amountMinor / 100} ${pricing.currency}`;
  }
}

async function renderBilling(context, message = "") {
  const target = main();
  if (!target) return;
  const seats = context.seats;
  const handoff = await createAddSeatHandoff().catch(() => null);
  const unitPrice = moneyMinor(seats.addOnPricing);
  target.innerHTML = `<div class="page org-subpage">${pageHeader("Plan & billing", "View the subscription entitlement facts AccelPO uses for seat capacity.")} ${message ? `<div class="org-success-banner">${esc(message)}</div>` : ""}<section class="org-surface-card billing-hero"><div><p class="eyebrow">Current plan</p><h2>${esc(context.plan?.name || "Plan not configured")}</h2><p>${esc(context.plan?.billingPeriod ? `Billing period: ${context.plan.billingPeriod}` : "Billing period unavailable")}</p></div><span class="org-status-chip">Entitlement-backed</span></section>${seatMeter(context)}<section class="org-surface-card"><div class="org-card-heading"><div><p class="eyebrow">Seat expansion</p><h2>${handoff ? "One more seat can be requested" : "No add-seat action is available"}</h2></div>${unitPrice ? `<strong>${esc(`${unitPrice} / seat`)}</strong>` : ""}</div><p class="org-helper">AccelPO reads included seats, add-on allowance, pricing, and the entitlement version from the shared commercial record. It does not infer seat quantities from the plan name.</p>${handoff ? (isPreviewMode() ? `<div class="org-inline-note"><strong>Preview only</strong><span>This simulates the capacity result so you can continue the People & seats flow. It does not charge a card or change a subscription.</span></div><div class="form-footer"><button class="primary-button" data-org-action="preview-add-seat">Preview one added seat</button></div>` : `<div class="org-inline-note"><strong>Billing handoff ready</strong><span>The shared billing destination must consume the add-seat handoff. AccelPO does not implement payment processing.</span></div>`) : ""}</section></div>`;
  activateOrganizationNav();
}

function activateOrganizationNav() {
  document.querySelectorAll(".nav-item").forEach((node) => {
    if (node.dataset.view === "organization") {
      node.classList.add("active");
      node.setAttribute("aria-current", "page");
    } else if (node.getAttribute("aria-current") === "page") {
      node.classList.remove("active");
      node.setAttribute("aria-current", "false");
    }
  });
}

async function enhanceOrganizationOverview() {
  if (currentHash() !== "organization") return;
  const page = document.querySelector(".page-organization");
  if (!page) return;
  try {
    const context = await loadOrganizationContext();
    const hero = page.querySelector(".organization-hero");
    const title = hero?.querySelector("h2");
    const description = hero?.querySelector("p:last-of-type");
    const seats = page.querySelector('[data-action="people"] small');
    if (title && title.textContent !== context.displayName) title.textContent = context.displayName;
    if (description) {
      const country = previewDetails().country || "United States";
      const next = `Purchasing workspace · ${country}`;
      if (description.textContent !== next) description.textContent = next;
    }
    if (seats) {
      const next = seatLabel(context);
      if (seats.textContent !== next) seats.textContent = next;
    }
  } catch {
    // The overview remains usable even if a connected projection is temporarily unavailable.
  }
}

async function renderCurrentSurface() {
  const route = currentHash();
  if (!CHILD_ROUTES.has(route)) {
    if (route === "organization") void enhanceOrganizationOverview();
    return;
  }
  try {
    if (route === "organization/details") {
      loading("Organization details");
      renderDetails(await loadOrganizationContext());
      return;
    }
    if (route === "organization/people") {
      loading("People & seats");
      renderPeople(await loadPeopleAndSeats());
      return;
    }
    if (route === "organization/purchasing") {
      loading("Approval & spending");
      renderPurchasing(await loadPurchasingConfiguration());
      return;
    }
    if (route === "organization/providers") {
      loading("Providers");
      renderProviders(await loadProviders());
      return;
    }
    if (route === "organization/billing") {
      loading("Plan & billing");
      await renderBilling(await loadOrganizationContext());
    }
  } catch (error) {
    const titles = {
      "organization/details": "Organization details",
      "organization/people": "People & seats",
      "organization/purchasing": "Approval & spending",
      "organization/providers": "Providers",
      "organization/billing": "Plan & billing",
    };
    errorSurface(titles[route] || "Organization", error);
  }
}

function showMenu() {
  document.querySelector("#org-menu-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "org-menu-overlay";
  overlay.className = "sheet-backdrop centered org-menu-backdrop";
  overlay.innerHTML = `<section class="sheet org-menu-sheet" role="dialog" aria-modal="true" aria-labelledby="org-menu-title"><div class="sheet-header"><div><p class="eyebrow">Organization</p><h2 id="org-menu-title">Workspace settings</h2></div><button class="icon-button" data-org-action="close-menu" aria-label="Close">×</button></div><div class="org-menu-list"><button data-org-route="organization/details"><strong>Organization details</strong><span>Shared workspace identity</span></button><button data-org-route="organization/people"><strong>People & seats</strong><span>Members, invitations and capacity</span></button><button data-org-route="organization/purchasing"><strong>Approval & spending</strong><span>Purchasing rules and controls</span></button><button data-org-route="organization/providers"><strong>Providers</strong><span>Existing provider list</span></button><button data-org-route="organization/billing"><strong>Plan & billing</strong><span>Subscription seat entitlement</span></button></div></section>`;
  document.body.append(overlay);
}

function notify(message) {
  document.querySelector("#org-surface-toast")?.remove();
  const node = document.createElement("div");
  node.id = "org-surface-toast";
  node.className = "toast";
  node.setAttribute("role", "status");
  node.textContent = message;
  document.body.append(node);
  window.setTimeout(() => node.remove(), 2800);
}

document.addEventListener("click", async (event) => {
  const actionElement = event.target.closest("[data-action]");
  const action = actionElement?.dataset.action;
  if (action && ACTION_ROUTES[action]) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    go(ACTION_ROUTES[action]);
    return;
  }
  if (action === "workspace" && (currentHash() === "organization" || CHILD_ROUTES.has(currentHash()))) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    showMenu();
    return;
  }

  const routeButton = event.target.closest("[data-org-route]");
  if (routeButton) {
    event.preventDefault();
    document.querySelector("#org-menu-overlay")?.remove();
    go(routeButton.dataset.orgRoute || "organization");
    return;
  }

  const orgAction = event.target.closest("[data-org-action]")?.dataset.orgAction;
  if (!orgAction) return;
  event.preventDefault();

  if (orgAction === "retry") return void renderCurrentSurface();
  if (orgAction === "close-menu") return document.querySelector("#org-menu-overlay")?.remove();
  if (orgAction === "show-invite") return renderPeople(await loadPeopleAndSeats(), { showInvite: true });
  if (orgAction === "hide-invite") return renderPeople(await loadPeopleAndSeats());
  if (orgAction === "add-seat") return go("organization/billing");
  if (orgAction === "show-provider") return renderProviders(await loadProviders(), true);
  if (orgAction === "hide-provider") return renderProviders(await loadProviders(), false);

  if (orgAction === "revoke-invitation") {
    try {
      await revokeInvitation(event.target.closest("[data-invitation-id]")?.dataset.invitationId || "");
      notify("Invitation revoked and reserved capacity released.");
      renderPeople(await loadPeopleAndSeats());
    } catch (error) {
      notify(error?.message || "The invitation could not be revoked.");
    }
    return;
  }

  if (orgAction === "remove-member") {
    try {
      await deactivateMembership(event.target.closest("[data-membership-id]")?.dataset.membershipId || "");
      notify("Team member access removed and seat released.");
      renderPeople(await loadPeopleAndSeats());
    } catch (error) {
      notify(error?.message || "The team member could not be removed.");
    }
    return;
  }

  if (orgAction === "preview-add-seat") {
    applyPreviewSeatExpansion();
    notify("Preview seat added. No billing action was performed.");
    go("organization/people");
  }
}, true);

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-org-form]");
  if (!form) return;
  event.preventDefault();
  event.stopPropagation();
  const values = Object.fromEntries(new FormData(form).entries());
  const kind = form.dataset.orgForm;

  try {
    if (kind === "details") {
      const saved = await saveOrganizationDetails(values);
      notify("Organization preview details saved.");
      renderDetails(saved.context);
      return;
    }
    if (kind === "invite") {
      await invitePerson(values);
      notify("Invitation sent and a seat reserved.");
      renderPeople(await loadPeopleAndSeats());
      return;
    }
    if (kind === "purchasing") {
      await savePurchasingConfiguration(values);
      renderPurchasing(await loadPurchasingConfiguration(), "Preview purchasing configuration saved.");
      return;
    }
    if (kind === "provider") {
      await addProvider(values);
      notify("Provider added to the preview workspace.");
      renderProviders(await loadProviders());
    }
  } catch (error) {
    if (error?.code === "seat-capacity-exhausted" && error?.details?.addSeatActionAllowed) {
      notify("Seat capacity is full. Add a seat before inviting another person.");
      go("organization/billing");
      return;
    }
    notify(error?.message || "The change could not be saved.");
  }
}, true);

window.addEventListener("hashchange", () => {
  window.queueMicrotask(() => void renderCurrentSurface());
});

const observer = new MutationObserver(() => {
  if (currentHash() === "organization") void enhanceOrganizationOverview();
});
if (app) observer.observe(app, { childList: true, subtree: true });

void renderCurrentSurface();
