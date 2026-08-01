# Slice 2.7 — Essential Organization Profile

**Status: IMPLEMENTED — amended by Registration and Activation Convergence**

## Canonical amendment

The original brief treated organization type, participation roles, and business objectives as essential-registration requirements. That model is superseded.

RFxchange now applies these governing rules:

- every activated organization can both issue and respond to opportunities;
- Buyer, Supplier, and Issuer are contextual transaction positions, not registration classifications;
- Official Resource Provider is a separately applied-for and administratively approved status;
- organization type is not required for essential activation or Profile Complete;
- business objectives are not collected during activation and do not select access to core product capabilities;
- previously persisted type, role, and objective metadata may remain for compatibility or later optional enrichment, but it cannot block activation.

## Feature treatment

- `ORG-007` — minimum organization identity/contact, amended to exclude required organization type.
- `ORG-008` — meaningful capability requirement, enhanced with controlled capability categories and an Other category.
- `ORG-010` — multi-role organization classification is removed from essential registration. Any future descriptive classification belongs to optional enrichment and cannot grant permissions or provider status.
- `ORG-011` — business objective preferences are removed from activation. Any future preference collection belongs to post-activation personalization.
- `ORG-012` — Profile Complete trigger is recalculated from the amended requirement set below.

## Objective

Create the minimum durable organization profile genuinely needed for useful network discovery and activate `Profile Complete` without asking the organization to repeat previously entered information or declare artificial buyer/supplier roles.

At slice exit, an authorized organization has a reusable identity seed, organization contact, website disposition, confirmed location and service geography, and at least one specific categorized capability.

## One durable organization profile

The existing `OrganizationProfile.id` and `organizationProfiles` document remain canonical. Essential registration enriches that same record; it never creates a parallel profile identity.

Information captured earlier in activation must be persisted and reused:

- organization name;
- organization website or explicit no-public-website disposition;
- organization phone where provided;
- authenticated user's name and email as the default organization contact;
- confirmed home locality and organization location.

The essential-registration screen reviews this carried-forward information and asks only for missing profile information, such as the contact's organization title and a meaningful capability.

## Meaningful capability

At least one specific capability is required. A capability contains:

- service, product, or function kind for activation;
- one controlled capability category;
- a required custom category when Other is selected;
- a specific capability name; and
- a bounded plain-language description.

Initial categories are:

- Professional and business services
- Construction and skilled trades
- Manufacturing and fabrication
- Technology, data and cybersecurity
- Transportation and logistics
- Marketing and creative services
- Facilities and real estate
- Education and workforce training
- Health, safety and security
- Food, hospitality and events
- Other

Generic names such as “services,” “solutions,” “other,” or “business services” do not satisfy the requirement.

Buying needs belong in an opportunity/RFx workflow. Resource-provider functions belong in the Official Resource Provider application.

## Profile Complete derivation

`Profile Complete` is an automatic organization-level Active credential/state. It becomes active only when these authoritative conditions are present:

1. durable organization identity;
2. explicit website disposition;
3. main organization contact;
4. at least one meaningful categorized capability;
5. at least one canonical service geography;
6. valid location visibility; and
7. confirmed primary organization location.

The following are explicitly **not** Profile Complete requirements:

- organization type;
- participation role;
- business objective;
- Official Resource Provider status;
- Organization Verified status;
- buyer, supplier, or issuer declarations;
- paid or Founding membership.

If a required field later becomes invalid or is removed, the derived current completion state becomes inactive while history remains auditable.

## Universal buyer/supplier participation

Core opportunity behavior is available to every activated organization, subject to user membership, permission, integrity, and workflow-specific rules. Registration does not ask whether the organization is a buyer or supplier.

A user acting with legitimate organization authority may:

- discover opportunities;
- respond to opportunities;
- create and issue opportunities;
- seek suppliers, customers, and teammates; and
- participate in referrals and teaming.

These product abilities do not depend on a self-declared organization role.

## Official Resource Provider boundary

“Resource Provider” is not a registration checkbox. An activated organization may later submit a governed application under Slice 3.6. The application collects provider category, services/programs, service geography, eligibility, intake, modality, contact, language, and supporting evidence. Only an authorized administrator may approve Official Resource Provider status.

## Design and UX requirements

- Carry previously entered identity fields forward; never ask the user to reconstruct them.
- Present organization name, website, contact, phone, locality, and location as reviewable carried-forward context.
- Use an accessible controlled category selector and conditionally required Other field.
- Do not show participation roles or business objectives during activation.
- Do not expose internal lifecycle terminology such as “controlled Exchange” to participants.
- Present Profile Complete as a legitimate activation milestone, not a score or purchase reward.

## Security and integrity requirements

- Profile mutation requires authorized organization scope.
- Cross-organization writes fail closed.
- Client state cannot award Profile Complete.
- Profile completion is derived server-side.
- Previously entered identity seed is server-managed resumable context and cannot grant organization authority.
- Capability category and text fields are bounded and validated.
- Resource-provider approval cannot be self-awarded through profile data.

## Acceptance intent

- organization type, participation roles, and business objectives do not block Profile Complete;
- activation does not submit role/objective arrays;
- organization website and phone entered during resolution survive refresh and populate the durable profile;
- omitting previously confirmed website fields during Profile Complete must preserve the persisted website disposition and URL;
- authenticated user name/email populate the default organization contact;
- a controlled capability category is required;
- Other requires a custom category;
- a generic capability name is rejected;
- required identity/contact/capability/geography/visibility/location conditions still fail closed;
- legacy role/objective/type data can hydrate without restoring obsolete activation gates.

## Explicit non-scope

- Official Resource Provider application/review implementation (`RES-001`–`RES-003`, `ADM-070`);
- detailed products/services taxonomy (`ORG-013`);
- NAICS/industry enrichment (`ORG-014`);
- certifications/licenses/UEI/CAGE/SAM enrichment (`ORG-015`);
- Organization Verification;
- paid placement or membership gating;
- OPEN release.
