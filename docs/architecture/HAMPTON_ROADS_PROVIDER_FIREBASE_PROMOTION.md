# Hampton Roads Provider Firebase Promotion

**Status:** Foundation implementation in progress — not independently verified

**Production authority:** `AccelAnalysis/RFxchange`

**Stacked over:** Hampton Roads comparison and approval governance

**Effective:** 2026-08-23

## Purpose

This packet implements the protected Firebase boundary that converts a currently approved Hampton Roads provider seed into canonical RFxchange identity and source-backed staging records without fabricating participant authority or publishing the provider.

It is intentionally distinct from:

- participant Organization creation;
- participant-confirmed Organization Location;
- Official Resource Provider application and approval;
- participant-authored Provider Resources;
- provider discovery publication;
- provider claim adjudication.

## Truthful promotion result

A committed promotion may create or attach:

1. a canonical Organization account and profile;
2. a seeded Organization discovery record with `authorityState: unestablished` and `verificationState: not-evaluated`;
3. a source-backed imported-location fact bound to the accepted coordinate and Geography Fabric profile;
4. a non-published provider seed draft containing the source-backed service description and claim handoff state;
5. an idempotent command receipt and append-only event.

It does not create a user, membership, participant attestation, Official Resource Provider status, Provider service profile, public discovery publication, or published Resource.

## Authorization

Preview and commit require a current server-resolved platform administrator authority context carrying the dedicated `provider.seed.promote` permission, GLOBAL scope, and satisfied pre-resolved conditions.

Stored administrator identifiers, Firestore paths, approval records, and client selection never prove current authority.

## Evidence binding

The service reloads the current candidate, source record, Geography Fabric materialization packet, canonical comparison, and approval. It recomputes deterministic SHA-256 fingerprints over normalized persisted truth and rejects stale or mismatched evidence before preview or commit.

The committed command must also retain the exact production confirmation already required by the promotion-governance packet.

## Create versus attach

### Create new Organization

The unit of work creates a canonical account, profile, and seeded discovery record only when the approved deterministic Organization ID is unused. Replaying the same command may reuse exactly matching records; conflicting identity fails.

### Attach existing Organization

The unit of work reloads the selected canonical Organization, profile, and discovery record. It must match the approved comparison evidence. Promotion cannot silently rename or overwrite the existing Organization.

## Source-backed location

Seeded providers cannot use the participant-confirmed location constructor because no participant or Organization membership exists yet. The import therefore persists a separate source-backed location fact with:

- Organization and location identity;
- accepted coordinate and fingerprint;
- normalized source address;
- source label, source record, donor repository, and donor commit;
- Geography Fabric profile identity and version;
- safe default visibility;
- unclaimed status;
- withheld participant projection.

The claim workflow may later reconcile or supersede this fact with participant-confirmed location truth. Import does not impersonate a user.

## Non-published provider seed draft

The draft preserves provider classification, participation policy, service name and summary, website, aliases, service-area labels, source identity, claim state, and Geography Fabric links. It explicitly records:

- Official Provider status: not granted;
- provider discovery: not published;
- Resource publication: not published;
- participant author: none;
- claim state: unclaimed or review-required according to approved evidence.

## Atomic persistence

The committed unit of work performs one Firestore transaction across the promotion command, canonical Organization writes or existing-Organization checks, source-backed location, provider seed draft, Geography Fabric materialization records, and append-only event.

A replay with the same command ID and request fingerprint is idempotent. Reuse of a command ID for different evidence fails.

## Packet boundaries

This packet does not execute a production import, approve any real candidate, expose an administrative UI, publish provider discovery, publish a Resource, activate a map marker, or bypass the ordinary Organization claim process.

The next packet may load reviewed Hampton Roads approval records, generate a complete dry-run, and execute only explicitly approved production commands with exact committed receipts.
