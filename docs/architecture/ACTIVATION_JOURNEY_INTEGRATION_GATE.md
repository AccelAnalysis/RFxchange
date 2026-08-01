# Wave 2 Activation Journey Integration + Runtime Convergence Gate

**Status: required integration/convergence gate; no Feature-ID completion change**

## Purpose

Compose the Wave 2 account, geography, organization, location, profile, marker and administrator authorities into one resumable runtime before later acquisition, orientation, first-value and OPEN work.

## Public versus account boundary

Public visitors receive marketing, authentication and required legal documents only. Participant and administrative surfaces require a trusted RFxchange session and the appropriate persisted lifecycle, membership, permissions and restrictions.

A Free account is a real RFxchange account. Payment is not the base application-access gate.

## Canonical runtime order

```text
Public Join
→ Firebase account + first RFxchange user
→ policy acceptance
→ Census-authoritative home locality typeahead
→ orientation position
→ find / claim / create organization
→ organization authority
→ confirmed location
→ essential registration
→ Profile Complete
→ real marker activation
→ Organization Activated
→ Exchange entry
→ future orientation/first-value completion
→ future OPEN
```

## Authentication and organization setup

Registration is organization-centered, but authentication and organization setup are distinct concerns.

- Registration collects organization name, first-user name, relationship, email and password.
- Returning sign-in collects email and password only.
- An authenticated account with no activation context is routed to a separate **Begin organization setup** state.
- Organization name is never requested as a sign-in credential or recovery field.

The browser exchanges a Firebase ID token for an HTTP-only RFxchange session cookie through the CSRF-protected server boundary.

## Resumable activation state

`ActivationJourneyContext` is server-managed orchestration state keyed to the trusted RFxchange user. It preserves provisional organization identity, descriptive organization relationship, website disposition/URL, phone, policy position, organization/membership references and any in-progress location draft.

This context carries information forward but cannot grant geography authority, organization authority, Profile Complete, marker activation or application access.

## Locality typeahead

The home-locality field is an accessible combobox:

- suggestions begin after at least two characters;
- requests are debounced and stale requests are cancelled;
- keyboard navigation supports Arrow Up/Down, Enter and Escape;
- results expose locality name, state, geography type and FIPS identity;
- short-lived server caching reduces repeated Census directory work; and
- the selected Census reference is resolved again server-side before persistence.

## Organization resolution and identity carry-forward

Organization resolution persists website disposition, normalized website URL and optional phone before search/create/claim. Domain matching derives from the normalized URL.

Essential registration consumes this persisted seed and the authenticated user's name/email. It does not ask the participant to recreate previously supplied organization information.

## Essential registration

Essential registration collects only:

- missing website disposition for legacy/incomplete journeys;
- contact organization title and public-contact choice;
- service/product/function kind;
- controlled capability category;
- required Other category when applicable;
- specific capability; and
- capability description.

It does not collect organization type, participation roles or business objectives.

Every activated organization can both issue and respond to opportunities. Resource-provider status is separately applied for and administratively approved.

## Profile Complete and marker

Profile Complete requires durable identity, website disposition, main contact, meaningful categorized capability, service geography, valid visibility and confirmed location.

It does not require organization type, participation role, business objective, paid status, Verification or provider status.

When Profile Complete is active, marker eligibility is recalculated through the existing authority, geography, location, restriction and marker contracts.

## Customer-facing terminology

Internal lifecycle terminology remains:

```text
organization-registered
→ organization-activated
→ controlled-platform
→ open-platform
```

Customer-facing surfaces do not say “controlled Exchange.” Activation success says the organization is ready, welcomes the participant to RFxchange, and offers **Enter the Exchange**.

## Official Resource Provider boundary

Official Resource Provider is governed by Slice 3.6. The application occurs after activation, collects provider-specific information/evidence, and requires an auditable administrator decision. Registration cannot self-award provider status.

## Acceptance

The integration gate must prove:

- returning sign-in contains only email/password;
- an authenticated user without activation can begin organization setup separately;
- locality suggestions debounce, cache and remain server-authoritative;
- organization website/phone survive refresh and carry into the profile;
- activation renders/submits no participation roles or business objectives;
- Profile Complete excludes organization-type and participation-role requirements;
- Other capability category requires custom text;
- participant copy contains no “controlled Exchange”; and
- existing marker activation and protected Exchange routing remain intact.
