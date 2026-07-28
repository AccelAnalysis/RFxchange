export const publicPositioning = {
  summary:
    "The RFxchange gives organizations a shared environment to be discovered by capability, find relevant demand, form useful connections, access support, and follow activity toward reported outcomes.",
  pillars: [
    { kicker: "Visible", title: "Capabilities become discoverable" },
    { kicker: "Connected", title: "Demand meets the right next step" },
    { kicker: "Actionable", title: "Connections move into real workflows" },
  ],
} as const;

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
