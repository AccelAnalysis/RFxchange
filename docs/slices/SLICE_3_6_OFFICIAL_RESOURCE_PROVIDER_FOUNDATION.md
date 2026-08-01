# Slice 3.6 — Official Resource Provider Foundation

**Status: PLANNING BRIEF ONLY — DO NOT IMPLEMENT UNTIL EXPLICITLY AUTHORIZED**

## Feature IDs

- `RES-001` — Official Resource Provider application
- `RES-002` — Provider admin review/approval
- `RES-003` — Provider service profile
- `ADM-070` — Resource-provider approval console

## Canonical boundary

Official Resource Provider is a separately applied-for, administratively approved organization status. It is not:

- a registration role;
- a self-declared organization type;
- a buyer/supplier classification;
- Organization Verified;
- a paid entitlement; or
- a Profile Complete requirement.

Every organization completes ordinary activation first. The provider application appears afterward in organization settings/profile as **Request Resource Provider Status**.

## Objective

Create the governed path by which an activated organization applies to become an Official Resource Provider, administrators review the application and evidence, an approved organization receives controlled provider status, and the provider maintains the structured service profile required for Network discovery and routing.

## Product rules

### `RES-001` — Application

An authorized organization may create one current provider application after legitimate activation/Profile Complete. The application references authoritative organization identity, contact, website, location and service-geography data rather than duplicating it.

The application collects:

- one or more provider categories;
- required Other category description where applicable;
- services, programs or assistance offered;
- service geography;
- organizations/people served;
- eligibility requirements;
- intake or referral method;
- in-person, virtual or hybrid availability;
- supported languages;
- official provider contact;
- authoritative website/domain;
- relevant credentials, documents or evidence; and
- attestation that the submitter may represent the organization.

Initial provider categories include:

- Economic development organization
- Chamber or business association
- Lender or capital provider
- Education or workforce institution
- Government assistance program
- Technical-assistance provider
- Incubator, accelerator or coworking organization
- Legal, accounting or professional support organization
- Procurement or contracting assistance organization
- Other

Categories are multi-select. The vocabulary must remain extensible so approval is not limited to only the initial examples.

### `RES-002` — Governed decision

Use an auditable lifecycle:

```text
Draft
→ Submitted
→ Under Review
→ Information Requested
→ Resubmitted
→ Approved or Denied
```

Only an authorized administrator with the appropriate scoped permission may request information, approve or deny.

Approval produces **Official Resource Provider** status. It does not automatically award Organization Verified, Verified Resource Provider, paid membership, credibility score or placement priority.

Denial preserves the application, reasons, reviewer attribution and reapplication policy.

### `RES-003` — Provider service profile

Approved providers maintain structured services/programs, service geography, eligibility, intake, contact, modality, language and availability. Provider-specific fields remain separate from the essential organization capability used for ordinary activation.

### `ADM-070` — Approval console

Authorized reviewers can inspect:

- current authoritative organization/profile data;
- provider categories and Other explanation;
- services/programs;
- geography and availability;
- eligibility/intake;
- contact/languages;
- submitted credentials/evidence;
- prior requests for information and responses; and
- complete decision history.

Review is scoped, permissioned, minimum-necessary and auditable.

## Acceptance intent

- registration contains no Resource Provider checkbox or organization-type shortcut;
- an activated organization can submit one governed application;
- provider category is multi-select and Other requires explanation;
- authoritative organization data is referenced rather than duplicated;
- authorized admins can request information, approve or deny;
- direct client mutation cannot self-approve provider status;
- approval produces Official Resource Provider only;
- paid, Founding or Verification state cannot bypass review;
- approved providers can maintain the structured service profile; and
- review and status history remain durable.

## Explicit non-scope

Do not implement annual revalidation/provider lifecycle (`ADM-071`), Verified Resource Provider credibility badge, advanced staff routing, provider analytics/API, public provider ranking or paid placement.

## Exit checkpoint

The Network has a legitimate, administratively governed inventory of Official Resource Providers with structured profiles ready for discovery and routing, while ordinary organizations remain universally capable of buying, supplying, issuing and responding without provider status.
