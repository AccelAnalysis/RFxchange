export const publicPositioning = {
  summary:
    "The RFxchange gives organizations a shared environment to be discovered by capability, find relevant demand, form useful connections, access support, and follow activity toward reported outcomes.",
  pillars: [
    { kicker: "Visible", title: "Capabilities become discoverable" },
    { kicker: "Connected", title: "Demand meets the right next step" },
    { kicker: "Actionable", title: "Connections move into real workflows" },
  ],
} as const;

export const publicDifferentiation = [
  {
    label: "More than a directory",
    detail:
      "Organization profiles describe capability, geography, and context so discovery can lead into opportunity, referral, teaming, or support workflows.",
  },
  {
    label: "Not a social feed",
    detail:
      "The network is organized around organizations, capabilities, opportunities, referrals, resources, and business relationships—not followers or general posting.",
  },
  {
    label: "Broader than a bid portal",
    detail:
      "RFx activity sits beside business discovery, partnerships, referrals, resources, and market context rather than standing alone as a list of solicitations.",
  },
] as const;

export const audienceEmphasis = [
  {
    name: "Economic developers + civic leaders",
    promise: "Connective economic infrastructure",
    detail: "See capabilities, circulate opportunity, coordinate resources, and learn from measured network activity.",
    signals: ["Visibility", "Coordination", "Intelligence", "Measured pilot"],
  },
  {
    name: "Businesses",
    promise: "A reusable business-development position",
    detail: "Be found, find demand, discover partners, and access the resources needed to act.",
    signals: ["Be found", "Find demand", "Build capacity", "Act with context"],
  },
  {
    name: "Resource providers",
    promise: "Contextual routing into support",
    detail: "Become discoverable at the moment of need and receive better-matched, more understandable handoffs.",
    signals: ["Qualified routing", "Service territory", "Handoffs", "Demand signals"],
  },
] as const;
