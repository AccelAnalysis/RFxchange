import { createTransactionalEmailTemplateDefinition } from "../../domain/communications/transactional-email-template.ts";
import { VersionedTransactionalEmailTemplateCatalog } from "../communications/transactional-email-template-catalog.ts";

export const REFERRAL_INVITATION_EVENT = "referral.invitation.sent";
export const REFERRAL_INVITATION_TEMPLATE = "referral-invitation";

export const referralInvitationTemplate = createTransactionalEmailTemplateDefinition({
  eventKey: REFERRAL_INVITATION_EVENT,
  eventVersion: 1,
  templateKey: REFERRAL_INVITATION_TEMPLATE,
  templateVersion: 1,
  purpose: "transactional",
  variables: [
    { key: "recipient_name", type: "string", maximumLength: 160 },
    { key: "sender_organization", type: "string", maximumLength: 160 },
    { key: "referral_summary", type: "string", maximumLength: 1200 },
    { key: "continue_url", type: "string", maximumLength: 2000 },
  ],
  subjectTemplate: "{{sender_organization}} sent you a business referral",
  textTemplate: "Hello {{recipient_name}},\n\n{{sender_organization}} sent you this business referral:\n\n{{referral_summary}}\n\nReview it securely: {{continue_url}}\n\nSending and delivery do not mean the referral has been accepted, contacted, or completed.",
  htmlTemplate: null,
});

export const referralTransactionalEmailCatalog = new VersionedTransactionalEmailTemplateCatalog([
  referralInvitationTemplate,
]);
