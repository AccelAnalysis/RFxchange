# Wave 1 Slice 1.7 — Versioned Legal Acknowledgement

## Scope

This slice implements only:

- GOV-001 — versioned Terms of Service acceptance
- GOV-002 — versioned Platform Rules / Code of Conduct acceptance
- GOV-003 — versioned Privacy Policy acknowledgement

The legal-consent foundation sits after identity/organization establishment and before later onboarding gates consume it.

## Canonical required documents

The legal domain defines exactly three required document kinds:

1. `terms-of-service`
2. `platform-rules`
3. `privacy-policy`

Terms and Platform Rules require affirmative `accepted` status.

Privacy requires `acknowledged` status. This distinction follows the user-journey requirement and avoids treating general privacy acknowledgement as blanket permission for future privacy-sensitive capabilities.

## Versioned evidence

A legal document is represented by an immutable `LegalDocumentVersion` containing:

- stable document-version ID
- document kind
- version identifier
- effective timestamp
- record creation timestamp

A user acknowledgement is represented by an immutable `LegalAcknowledgement` containing:

- acknowledgement ID
- user ID
- organization-membership ID
- organization ID
- exact document-version ID
- document kind
- document version
- status (`accepted` or `acknowledged` as appropriate)
- recorded timestamp
- explicit-user-action evidence metadata

This intentionally does not use boolean state such as `termsAccepted = true`.

## Organization and user attribution

Acknowledgement is individual to the registered user while remaining tied to the organization context in which that user is acting.

Creation therefore derives attribution from established domain records:

- `UserIdentity`
- `OrganizationMembership`
- `OrganizationAccount`

The membership must be active, belong to the user, and belong to the organization.

Later users joining the same organization can therefore acknowledge the governing documents independently without recreating organization registration.

## Current-version gate

`resolveLegalAcknowledgementGate` evaluates one current required version for each of the three document kinds.

The gate is complete only when the exact current version of each document has the required user action recorded for the same user, membership and organization.

Historic acknowledgement remains evidence but does not automatically satisfy a newer required document version.

Example:

- Terms 1.0 accepted
- Rules 1.0 accepted
- Privacy 1.0 acknowledged
- gate complete
- Terms 2.0 becomes current
- gate becomes pending only for Terms 2.0
- the Terms 1.0 record remains historical evidence

This is the foundation needed for future renewed acceptance of material Terms changes.

## Persistence boundary

Both document versions and acknowledgement records are append/read oriented.

The repository ports expose no update or delete operations so history cannot be rewritten through the domain persistence contract.

Policy drafting, publication, withdrawal, replacement and administrative policy-management workflows are intentionally deferred.

## Explicit deferrals

This slice does not implement:

- legal-document authoring UI
- admin policy publishing/version-management workflows
- counsel approval workflow
- legal copy/content storage or rendering
- email/in-app policy-change notifications
- material-versus-minor change classification workflow
- automatic lifecycle transition blocking
- onboarding screen UI
- privacy permission/consent for specific future data uses
- cookie consent
- jurisdiction-specific privacy rights workflows
- organization-authority representation by the initial administrator
- policy revocation/withdrawal workflow
- database adapters or migrations
- admin audit UI
- tracker spreadsheet updates

Those concerns remain later slices/features.

## Acceptance criteria

Slice 1.7 is acceptable when tests and architecture guardrails prove:

1. all three required document kinds exist;
2. Terms and Rules require affirmative acceptance;
3. Privacy requires acknowledgement;
4. acknowledgement records preserve user, membership, organization, document, version, status, timestamp and evidence metadata;
5. inactive memberships cannot record acknowledgements;
6. cross-user and cross-tenant attribution is rejected;
7. the gate requires exactly one current version of each required document;
8. only acknowledgement of the exact current version satisfies the gate;
9. replacing a current version creates a fresh pending requirement without mutating historic acknowledgement;
10. legal persistence ports remain append/read only.
