import { createTransactionalEmailTemplateDefinition } from "../../domain/communications/transactional-email-template.ts";
import { VersionedTransactionalEmailTemplateCatalog } from "../communications/transactional-email-template-catalog.ts";

export const PROVIDER_ACQUISITION_EVENT = "provider.acquisition.invitation.sent";

export const providerAcquisitionTemplate = createTransactionalEmailTemplateDefinition({
  eventKey: PROVIDER_ACQUISITION_EVENT,
  eventVersion: 1,
  templateKey: "provider-acquisition-invitation",
  templateVersion: 1,
  purpose: "transactional",
  variables: [
    { key: "recipient_name", type: "string", maximumLength: 160 },
    { key: "provider_organization", type: "string", maximumLength: 160 },
    { key: "invitation_context", type: "string", maximumLength: 600 },
    { key: "continue_url", type: "string", maximumLength: 2000 },
  ],
  subjectTemplate: "{{provider_organization}} invited you to The RFxchange",
  textTemplate: "Hello {{recipient_name}},\n\n{{provider_organization}} shared this invitation:\n\n{{invitation_context}}\n\nContinue securely: {{continue_url}}\n\nThe invitation preserves context. It does not grant organization authority, provider status, eligibility, or access to a private opportunity.",
  htmlTemplate: null,
});

export const resourceNetworkTransactionalEmailCatalog = new VersionedTransactionalEmailTemplateCatalog([providerAcquisitionTemplate]);
