/**
 * CP-02 RouteSurface registry.
 *
 * The static preview uses this module as its single navigation source. Later application parts
 * contribute views through the same route shape instead of adding another router or navigation
 * tree. Hash routes keep the GitHub Pages preview deep-linkable.
 */
export const ACCELPO_ROUTES = Object.freeze({
  home: Object.freeze({ id: "home", label: "Home", icon: "home", hash: "home", showInNavigation: true }),
  purchases: Object.freeze({ id: "purchases", label: "Purchases", icon: "bag", hash: "purchases", showInNavigation: true }),
  new: Object.freeze({ id: "new", label: "New purchase", icon: "plus", hash: "new", showInNavigation: true }),
  tasks: Object.freeze({ id: "tasks", label: "Tasks", icon: "check", hash: "tasks", showInNavigation: true }),
  organization: Object.freeze({ id: "organization", label: "Organization", icon: "building", hash: "organization", showInNavigation: true }),
  organizationDetails: Object.freeze({ id: "organization-details", label: "Organization details", icon: null, hash: "organization/details", showInNavigation: false }),
  organizationPeople: Object.freeze({ id: "organization-people", label: "People & seats", icon: null, hash: "organization/people", showInNavigation: false }),
  organizationPurchasing: Object.freeze({ id: "organization-purchasing", label: "Approval & spending", icon: null, hash: "organization/purchasing", showInNavigation: false }),
  organizationProviders: Object.freeze({ id: "organization-providers", label: "Providers", icon: null, hash: "organization/providers", showInNavigation: false }),
  organizationBilling: Object.freeze({ id: "organization-billing", label: "Plan & billing", icon: null, hash: "organization/billing", showInNavigation: false }),
  purchaseDetail: Object.freeze({ id: "purchase-detail", label: "Purchase details", icon: null, hash: "purchase/:caseId", showInNavigation: false }),
});

const routeContributions = new Map();

export function registerRouteContribution(partId, routes) {
  if (!partId || !Array.isArray(routes)) throw new Error("A route contribution requires a part and routes.");
  routeContributions.set(partId, Object.freeze(routes.map((route) => Object.freeze({ ...route }))));
}

export function registeredRoutes() {
  return Object.freeze([
    ...Object.values(ACCELPO_ROUTES),
    ...[...routeContributions.values()].flat(),
  ]);
}

export function routeFromHash(hash) {
  const normalized = String(hash || "").replace(/^#/, "").replace(/^\//, "");
  const [segment, caseId] = normalized.split("/");
  if (segment === "purchase" && caseId) return Object.freeze({ view: "purchase-detail", caseId: decodeURIComponent(caseId) });
  const view = registeredRoutes().find((route) => route.hash === normalized)?.id || "home";
  return Object.freeze({ view, caseId: null });
}

export function hashForRoute(view, caseId = null) {
  if (view === "purchase-detail" && caseId) return `purchase/${encodeURIComponent(caseId)}`;
  return registeredRoutes().find((route) => route.id === view)?.hash || ACCELPO_ROUTES.home.hash;
}

export function navigationRoutes() {
  return Object.freeze(registeredRoutes().filter((route) => route.showInNavigation));
}
