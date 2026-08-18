import { createTransactionalEmailTemplateDefinition } from "../../domain/communications/transactional-email-template.ts";
import { VersionedTransactionalEmailTemplateCatalog } from "../communications/transactional-email-template-catalog.ts";

export const TEAM_INVITATION_EVENT = "rfx.team-invitation.sent";
export const TEAM_INVITATION_TEMPLATE = "rfx-team-invitation";

export const teamInvitationTemplate = createTransactionalEmailTemplateDefinition({
  eventKey: TEAM_INVITATION_EVENT,
  eventVersion: 1,
  templateKey: TEAM_INVITATION_TEMPLATE,
  templateVersion: 1,
  purpose: "transactional",
  variables: [
    { key: "recipient_name", type: "string", maximumLength: 160 },
    { key: "lead_organization", type: "string", maximumLength: 160 },
    { key: "opportunity_title", type: "string", maximumLength: 240 },
    { key: "capability_need", type: "string", maximumLength: 240 },
    { key: "proposed_responsibility", type: "string", maximumLength: 800 },
    { key: "continue_url", type: "string", maximumLength: 2000 },
  ],
  subjectTemplate: "{{lead_organization}} invited you to review an RFx role",
  textTemplate: "Hello {{recipient_name}},\n\n{{lead_organization}} invited you to review a proposed role for {{opportunity_title}}.\n\nCapability need: {{capability_need}}\nProposed responsibility: {{proposed_responsibility}}\n\nReview securely: {{continue_url}}\n\nReviewing this invitation does not grant organization authority. Accepting records RFx-scoped participation only; it does not create a subcontract, joint venture, teaming agreement, exclusivity, compensation obligation, promise to submit, or authority to bind another organization.",
  htmlTemplate: null,
});

export const opportunityTeamingTransactionalEmailCatalog =
  new VersionedTransactionalEmailTemplateCatalog([teamInvitationTemplate]);
