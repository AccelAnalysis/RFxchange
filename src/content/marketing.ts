export const publicPositioning = {
  summary:
    "The RFxchange helps organizations turn ordinary business meaning into reusable market context so they can become easier to understand, discover, and connect.",
  pillars: [
    { kicker: "Visible", title: "Capabilities become discoverable" },
    { kicker: "Connected", title: "Context travels to the next step" },
    { kicker: "Actionable", title: "Available workflows support business action" },
  ],
} as const;

export const publicValueProgression = Object.freeze([
  Object.freeze({
    kicker: "Understandable",
    title: "Express what the organization actually does",
  }),
  Object.freeze({
    kicker: "Discoverable",
    title: "Be found through useful market context",
  }),
  Object.freeze({
    kicker: "Connectable",
    title: "Carry purpose into the business relationship",
  }),
  Object.freeze({
    kicker: "Actionable",
    title: "Use available workflows for the next appropriate action",
  }),
] as const);

export const publicDifferentiation = [
  {
    label: "More than a directory",
    detail:
      "The Exchange connects organization identity, capabilities, geography, service context, referrals, resource providers, and guidance.",
  },
  {
    label: "Not a social feed",
    detail:
      "The product is organized around organizations, capabilities, geography, consent, and business workflows—not follower counts or general posting.",
  },
  {
    label: "Broader than a bid portal",
    detail:
      "RFx activity belongs inside a wider local business growth network that also connects capabilities, resources, referrals, and intelligence.",
  },
] as const;

export const publicAvailability = Object.freeze([
  Object.freeze({
    status: "Available now",
    title: "Organization and market profile",
    detail:
      "Create or claim an organization, confirm its map position, and describe its capabilities and market information.",
  }),
  Object.freeze({
    status: "Available now",
    title: "Discovery and connections",
    detail:
      "Find participating organizations, create referrals, discover resource providers, and carry useful context into the connection.",
  }),
  Object.freeze({
    status: "Available now",
    title: "Resources and guidance",
    detail:
      "View provider resources and reopen Quick Start, role paths, and contextual help when you need it.",
  }),
  Object.freeze({
    status: "Coming next",
    title: "More Exchange workflows",
    detail:
      "Additional RFx, credibility, outcome, capacity, and commerce tools will appear as they become available.",
  }),
] as const);

export const audienceEmphasis = [
  {
    name: "Economic developers + civic leaders",
    promise: "Connective economic infrastructure",
    detail:
      "Use participating organization, capability, geography, referral, and resource-provider context as one view into the local market.",
    signals: ["Visibility", "Coordination", "Resources", "Measured activity"],
  },
  {
    name: "Businesses",
    promise: "A reusable business-development position",
    detail:
      "Establish the organization and its capabilities, then use discovery, referrals, resources, and guidance to find the next useful connection.",
    signals: ["Be found", "Capability", "Geography", "Next action"],
  },
  {
    name: "Resource providers",
    promise: "Contextual routing into support",
    detail:
      "Show services, territories, eligibility, intake, resources, and the best way for businesses to connect.",
    signals: ["Provider status", "Service territory", "Handoffs", "Need context"],
  },
] as const;
