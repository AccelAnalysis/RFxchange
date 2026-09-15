# AccelPO CP-07 FileEvidence

CP-07 is AccelPO's private file and evidence boundary for Purchase Case quotes, receipts, photos,
service-completion evidence, and related attachments. It does not create a second storage service:
bytes remain in the existing server-managed Firebase private object store and direct client Storage
Rules stay denied.

## Contract

- `file-evidence.initiate-upload` runs through CP-03, verifies the selected organization and owning
  Purchase Case, creates one private pending evidence record, and records immutable evidence history.
- The authenticated content route re-authorizes the initiating uploader through CP-03 before writing
  bytes. Objects use `organizations/{organizationId}/private/accelpo-evidence/{evidenceId}/object`.
- Upload content is bounded to 25 MiB, restricted to PDF, Word, JPEG, PNG, and WebP, and checked at
  the existing file-signature boundary before persistence.
- Upload receipts are durable and content-addressed by SHA-256 for retry/conflict detection. A retry
  with the same evidence/content is safe; the same evidence identity cannot be reused for different
  content.
- `file-evidence.complete-upload` runs through CP-03, verifies the committed object receipt in the
  command transaction, advances the evidence version, and leaves the file private.
- Evidence metadata is read only through CP-04's existing `evidence-metadata` projection. Raw object
  paths and Storage URLs are never returned to the browser.
- Downloads are authenticated, CP-04-authorized responses streamed through the application route
  with `private, no-store` caching. No public or long-lived bearer URL is created.
- `file-evidence.release` is a separate `rfx.publish` command. Only this explicit, versioned action
  changes `releaseStatus` to `released`; attachment to a Purchase Case does not release anything.
- `file-evidence.make-private` reverses release without deleting metadata, the private object, or the
  append-only evidence history.

## Chassis registration

CP-07 registers the `FileEvidence` part and consumes the existing `CommandPort` and
`QueryProjection` connection points. It adds no user-facing route and no navigation item.

## Data ownership

CP-07 owns `accelpoEvidence`, `accelpoEvidenceHistory`, and the infrastructure receipt collection
`accelpoEvidenceObjects`. It references `accelpoPurchaseCases` and the shared private object store.

## Downstream contract

P8 can attach and review evidence using the private metadata/reference. P6/CP-08 may include only
references for records whose status is `uploaded` and release status is `released`; CP-07 never
publishes a raw object path or Storage URL.
