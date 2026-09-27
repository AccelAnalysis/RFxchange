import React, { useState, useEffect } from "react";
import { OpportunityTeammateWorkspace } from "../../src/components/rfx/OpportunityTeammateWorkspace";
import { OpportunityTeamInvitationReview } from "../../src/components/rfx/OpportunityTeamInvitationReview";
import { OrganizationEnrichmentPanel } from "../../src/components/organization-enrichment/OrganizationEnrichmentPanel";
import { MarketProfilePanel } from "../../src/components/market-profile/MarketProfilePanel";
export function UpdatesFixture() {
  const [view, setView] = useState(null);
  useEffect(() => {
    window.renderUpdate = (kind, props) => setView({ kind, props });
    return () => {
      delete window.renderUpdate;
    };
  }, []);
  if (!view) return React.createElement("div", { id: "updates-ready" });
  const Component = {
    teaming: OpportunityTeammateWorkspace,
    invitation: OpportunityTeamInvitationReview,
    enrichment: OrganizationEnrichmentPanel,
    market: MarketProfilePanel,
  }[view.kind];
  return React.createElement(Component, { ...view.props, key: view.kind });
}
