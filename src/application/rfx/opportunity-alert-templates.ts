import { createTransactionalEmailTemplateDefinition } from "../../domain/communications/transactional-email-template.ts";
import { VersionedTransactionalEmailTemplateCatalog } from "../communications/transactional-email-template-catalog.ts";

export const OPPORTUNITY_ALERT_EVENT = "rfx.opportunity-alert";
export const OPPORTUNITY_ALERT_TEMPLATE = "rfx-opportunity-alert";

export const opportunityAlertTemplate = createTransactionalEmailTemplateDefinition({
  eventKey: OPPORTUNITY_ALERT_EVENT,
  eventVersion: 1,
  templateKey: OPPORTUNITY_ALERT_TEMPLATE,
  templateVersion: 1,
  purpose: "transactional",
  variables: [
    { key: "recipient_name", type: "string", maximumLength: 160 },
    { key: "opportunity_count", type: "number" },
    { key: "opportunity_summary", type: "string", maximumLength: 1800 },
    { key: "continue_url", type: "string", maximumLength: 2000 },
  ],
  subjectTemplate: "{{opportunity_count}} RFx opportunity update",
  textTemplate: "Hello {{recipient_name}},\n\nA saved RFx search found {{opportunity_count}} currently permitted opportunity update(s):\n\n{{opportunity_summary}}\n\nReview the current details securely: {{continue_url}}\n\nA saved-search match is not qualification, eligibility, endorsement, or an award prediction.",
  htmlTemplate: null,
});

export const opportunityAlertTransactionalEmailCatalog =
  new VersionedTransactionalEmailTemplateCatalog([opportunityAlertTemplate]);
