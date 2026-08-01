export const publicPositioning = {
  summary:
    "The RFxchange gives organizations a shared environment to be discovered by capability and, as each governed workflow is released, move from visibility into opportunity, referral, teaming, and support.",
  pillars: [
    { kicker: "Visible", title: "Capabilities become discoverable" },
    { kicker: "Connected", title: "Context travels to the next step" },
    { kicker: "Actionable", title: "Released workflows support real action" },
  ],
} as const;

export const publicDifferentiation = [
  {
    label: "More than a directory",
    detail:
      "The live activation experience establishes an organization, its capability, geography, and real map presence. Later governed releases extend that position into Network and RFx workflows.",
  },
  {
    label: "Not a social feed",
    detail:
      "The product is organized around organizations, capabilities, geography, and authorized business workflows—not follower counts, general posting, or invented activity.",
  },
  {
    label: "Broader than a bid portal",
    detail:
      "The planned RFx engine belongs inside a wider local business growth network. Until that engine is released, public copy identifies it as planned rather than presenting it as live.",
  },
] as const;

export const publicAvailability = Object.freeze([
  Object.freeze({
    status: "Available now",
    title: "Establish your organization",
    detail:
      "Create an account, select an authoritative locality, resolve or create the organization, confirm its location, add a meaningful capability, and complete the governed activation journey.",
  }),
  Object.freeze({
    status: "Available now",
    title: "Become visible on the map",
    detail:
      "A successfully activated organization receives its real or privacy-safe organization node in the correct controlled geography and enters the authenticated Exchange workspace.",
  }),
  Object.freeze({
    status: "In development",
    title: "Discover the live Network",
    detail:
      "Capability search, permitted organization discovery, referrals, official resource providers, and richer Network lenses are being released through the adopted Wave 3 sequence.",
  }),
  Object.freeze({
    status: "Planned product pathway",
    title: "Move through RFx and outcomes",
    detail:
      "The RFx transaction engine, credibility evidence, and outcome expressions remain later governed domains. Diagrams describe the product model, not current market activity.",
  }),
] as const);

export const audienceEmphasis = [
  {
    name: "Economic developers + civic leaders",
    promise: "Connective economic infrastructure",
    detail:
      "Begin with real organization and geography visibility; later governed releases add resource coordination and measured network activity.",
    signals: ["Visibility", "Coordination", "Intelligence", "Measured pilot"],
  },
  {
    name: "Businesses",
    promise: "A reusable business-development position",
    detail:
      "Establish the organization and its capabilities now, then use Network and RFx workflows as they become available.",
    signals: ["Be found", "Capability", "Geography", "Next action"],
  },
  {
    name: "Resource providers",
    promise: "Contextual routing into support",
    detail:
      "Official provider application, routing, and service-territory discovery remain controlled Wave 3 releases rather than self-selected registration roles.",
    signals: ["Controlled approval", "Service territory", "Handoffs", "Need context"],
  },
] as const;
