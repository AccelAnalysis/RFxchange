export const publicPositioning = {
  summary:
    "The RFxchange helps organizations turn ordinary business meaning into governed, reusable market structure so they can become easier to understand, discover, and connect through released workflows.",
  pillars: [
    { kicker: "Visible", title: "Capabilities become discoverable" },
    { kicker: "Connected", title: "Context travels to the next step" },
    { kicker: "Actionable", title: "Released workflows support real action" },
  ],
} as const;

export const publicValueProgression = Object.freeze([
  Object.freeze({
    kicker: "Understandable",
    title: "Express what the organization actually does",
  }),
  Object.freeze({
    kicker: "Discoverable",
    title: "Be found through confirmed market context",
  }),
  Object.freeze({
    kicker: "Connectable",
    title: "Carry purpose into the business relationship",
  }),
  Object.freeze({
    kicker: "Actionable",
    title: "Use released workflows for the next appropriate action",
  }),
] as const);

export const publicDifferentiation = [
  {
    label: "More than a directory",
    detail:
      "The live Network connects real organization identity, confirmed AMACS-backed capabilities, geography, service context, referrals, approved resource providers, and persistent guidance.",
  },
  {
    label: "Not a social feed",
    detail:
      "The product is organized around organizations, capabilities, geography, consent, and authorized business workflows—not follower counts, general posting, or invented activity.",
  },
  {
    label: "Broader than a bid portal",
    detail:
      "The planned RFx engine belongs inside a wider local business growth network. Until RFx Core is released, public copy identifies that transaction pathway as planned rather than live.",
  },
] as const;

export const publicAvailability = Object.freeze([
  Object.freeze({
    status: "Available now",
    title: "Organization and market profile",
    detail:
      "Create or claim an organization, establish its real or privacy-safe map position, and confirm AMACS-backed capabilities plus authorized enrichment.",
  }),
  Object.freeze({
    status: "Available now",
    title: "Network discovery and connections",
    detail:
      "Discover permitted organizations, create consented referrals, find approved resource providers, and create governed provider connections.",
  }),
  Object.freeze({
    status: "Available now",
    title: "Resources and persistent education",
    detail:
      "View governed provider resources and reopen Quick Start, role paths, and contextual workflow explainers.",
  }),
  Object.freeze({
    status: "Next governed pathway",
    title: "RFx Core, credibility, and commerce",
    detail:
      "RFx creation, responses, teaming, evaluation, credibility, outcomes, advanced capacity routing, and paid entitlements remain later governed work.",
  }),
] as const);

export const audienceEmphasis = [
  {
    name: "Economic developers + civic leaders",
    promise: "Connective economic infrastructure",
    detail:
      "Use real participating organization, capability, geography, referral, and resource-provider context without treating incomplete participation as the whole economy.",
    signals: ["Visibility", "Coordination", "Resources", "Measured activity"],
  },
  {
    name: "Businesses",
    promise: "A reusable business-development position",
    detail:
      "Establish the organization and its confirmed capabilities, then use live discovery, referrals, resources, and persistent guidance.",
    signals: ["Be found", "Capability", "Geography", "Next action"],
  },
  {
    name: "Resource providers",
    promise: "Contextual routing into support",
    detail:
      "Approved providers can expose governed services, territories, eligibility, intake, resources, and consented connection pathways.",
    signals: ["Controlled approval", "Service territory", "Handoffs", "Need context"],
  },
] as const;
