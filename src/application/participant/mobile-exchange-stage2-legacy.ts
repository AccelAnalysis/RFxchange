/**
 * Frozen Stage 2 evidence fixture.
 *
 * This module is not a current runtime registry. It keeps the predecessor tuple and action IDs
 * available to historical acceptance without allowing them to leak into successor serialization.
 */
export const MOBILE_EXCHANGE_STAGE2_LENS_IDS = Object.freeze([
  "opportunities-rfx",
  "resources",
  "intelligence",
  "referrals",
] as const);

export const EXCHANGE_ROOM_PHASE2_ACTION_IDS = Object.freeze([
  "opportunities.find", "opportunities.create-rfx", "opportunities.pursue-respond", "opportunities.team",
  "resources.find-providers", "resources.browse-resources", "resources.my-requests", "resources.provider-status",
  "intelligence.organizations", "intelligence.capabilities", "intelligence.locations", "intelligence.layers",
  "referrals.new", "referrals.sent", "referrals.received", "referrals.starred",
] as const);
