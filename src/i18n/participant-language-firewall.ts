const exactReplacements = new Map<string, string>([
  ["Create a governed RFx draft", "Create an RFx draft"],
  ["Governed lifecycle", "Status"],
  ["Request-type authority", "Request type"],
  ["Need, scope, location, value, requirements, readiness, and publication become available only in later governed steps.", "Continue through the draft to add need, scope, location, value, requirements, readiness, and publication details."],
  ["This first action creates only the private RFx kernel and its governed request-type snapshot.", "This creates a private RFx draft with the request type you selected."],
  ["Operational location stays private in this draft; publication visibility is a separate governed decision.", "The performance location stays private in this draft. You choose what responders can see when you publish."],
  ["Use governed capabilities and requirement types. Potential fit never means qualification or endorsement.", "Use capabilities and requirement types. Potential fit never means qualification or endorsement."],
  ["Add an RFx-specific responder section without changing the governed catalog.", "Add a response section specific to this RFx."],
  ["The server checks the current RFx, geography, authority, and responder projection before publication.", "The Exchange checks the RFx, location, your permission to publish, and responder-facing information before publication."],
  ["Projection digest", "Preview reference"],
  ["Basic issuance is included for eligible organizations. Publication is atomic and cannot be undone in this slice.", "Eligible organizations can publish an RFx. Publishing makes it available to responders and cannot currently be undone."],
  ["Authoritative publication", "Published RFx"],
  ["Open controlled share link", "Open share link"],
  ["This link preserves intent but grants no membership, response, invitation, or qualification authority.", "Opening this link does not give someone membership, response, invitation, or qualification access."],
  ["Authoritative RFxchange publication", "Published on RFxchange"],
  ["Publication boundary", "What responders can see"],
  ["Private locations, actors, internal notes, audit evidence, and interpretation records are excluded from this projection.", "Private locations, internal notes, review records, and interpretation details are not shown to responders."],
  ["Restore the governed AMACS request-type snapshot.", "Reconfirm the AMACS request type."],
  ["Link this evidence requirement to governed evidence.", "Link this requirement to supporting evidence."],
  ["Complete governed requirements.", "Complete the requirements."],
  ["Find real published opportunities", "Find published opportunities"],
  ["Permitted published opportunities", "Published opportunities"],
  ["No permitted opportunities match this search", "No opportunities match this search"],
  ["Broaden or clear the filters. The Exchange does not create placeholder opportunities or infer market activity.", "Broaden or clear the filters and try again."],
  ["Only real, currently permitted publications are shown.", "Only opportunities available to you are shown."],
  ["Derived from canonical response deadlines and the server clock.", "Based on the response deadlines shown on each opportunity."],
  ["Search saved with its current governed filters.", "Search saved with its current filters."],
]);

const phraseReplacements: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bgoverned\s+/gi, ""],
  [/\bnon-authoritative\b/gi, "suggested"],
  [/\bauthoritative\b/gi, "confirmed"],
  [/\bserver-authorized\b/gi, "available"],
  [/\bcanonical\b/gi, "current"],
  [/\bcontrolled geography\b/gi, "selected geography"],
  [/\bcontrolled locality\b/gi, "selected locality"],
  [/\bcontrolled Network\b/gi, "Exchange"],
  [/\bprojection\b/gi, "view"],
  [/\bprovenance\b/gi, "source information"],
  [/\blifecycle\b/gi, "status"],
  [/\bWave\s+3\b/gi, "current"],
  [/\bWave\s+4\b/gi, "upcoming"],
  [/\bWave\s+\d+(?:\.\d+)?\b/gi, "upcoming"],
  [/\bSlice\s+\d+(?:\.\d+)?\b/gi, "release"],
  [/\breal published\b/gi, "published"],
  [/\breal permitted\b/gi, "available"],
  [/\breal organization(s)?\b/gi, "organization$1"],
  [/\breal map position\b/gi, "map position"],
  [/\breal market activity\b/gi, "market activity"],
  [/\bcurrent-authority\b/gi, "current"],
  [/\borganization authority\b/gi, "organization permissions"],
  [/\bissuer authority\b/gi, "issuer permissions"],
  [/\brecipient authority\b/gi, "recipient permissions"],
  [/\bprovider authority\b/gi, "provider permissions"],
  [/\bcurrent authority\b/gi, "current permissions"],
  [/\bversioned evidence\b/gi, "supporting information"],
  [/\bimplementation slice(s)?\b/gi, "release$1"],
  [/\bapproved slice(s)?\b/gi, "available feature$1"],
];

export function rewriteParticipantText(value: string): string {
  let next = exactReplacements.get(value) ?? value;

  for (const [pattern, replacement] of phraseReplacements) {
    next = next.replace(pattern, replacement);
  }

  return next
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export function applyParticipantLanguageFirewall<T>(value: T): T {
  if (typeof value === "string") {
    return rewriteParticipantText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyParticipantLanguageFirewall(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        applyParticipantLanguageFirewall(item),
      ]),
    ) as T;
  }

  return value;
}
