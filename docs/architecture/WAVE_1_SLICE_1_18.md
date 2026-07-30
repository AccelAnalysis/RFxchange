# Wave 1 Slice 1.18 — ADM-090

## Scope

This slice implements `ADM-090` — Minimum-necessary administrative data permissions.

The privacy rule is simple: an administrator's ability to operate on one class of data must not silently expose unrelated sensitive data.

## Data classes

The authorization model now distinguishes:

- organization profile data — `organization.profile.read`;
- private organization documents — `organization.document.private.read`;
- verification evidence — `credibility.verification-evidence.read`;
- payment metadata — `commerce.payment-metadata.read`;
- private RFx evidence — `rfx.private-evidence.read`;
- complaint/investigation evidence — `trust.complaint-evidence.read`.

Each class has a separate catalogued capability.

## Minimum-necessary behavior

The existing Platform Administrator bundle can continue reading and editing ordinary organization profile data, but it does not receive any of the five new sensitive-data read permissions by default.

Likewise, profile-edit authority does not imply private-document, verification, payment, private-RFx, or complaint-evidence authority.

Sensitive read capabilities may be assigned individually through the existing ADM-013 permission override mechanism and remain subject to the existing scope and condition layers.

## No transitive authority

The data-access policy maps one data class to exactly one named permission and then delegates to the existing administrative authorization engine. There is no inheritance such as:

- profile read -> verification evidence;
- commerce account read -> payment metadata;
- RFx record read -> private response evidence;
- support/trust case visibility -> complaint evidence.

This prevents routine operational roles from accumulating unnecessary sensitive-data visibility.

## Acceptance

ADM-090 is complete only when tests prove:

1. every protected administrative data class has a distinct catalogued permission;
2. Platform Administrator can read ordinary profile data but cannot read the protected classes by default;
3. profile update permission does not imply any protected-data read permission;
4. each sensitive capability can be granted independently without granting another class;
5. Super Admin access remains explicit through the complete permission catalog rather than transitive implication;
6. the policy remains provider-independent and uses the existing authorization engine;
7. the full production CI suite remains green.
