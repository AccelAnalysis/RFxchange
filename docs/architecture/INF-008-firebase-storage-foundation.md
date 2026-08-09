# INF-008 — Firebase Storage document and media foundation

## Scope

INF-008 establishes the private-by-default file/object boundary required by the RFxchange tracker for organization logos and media, authority and verification evidence, and later RFx documents.

The slice does not create end-user upload routes or screens. It creates the storage model, access policy, Firebase adapter, Firestore metadata reference, Security Rules, emulator acceptance, and deployment conventions that later feature slices must use.

## Governing architecture

RFxchange treats object bytes and metadata as two coordinated resources:

```text
provider-independent application service
        ↓
organization/admin access decision
        ↓
pending Firestore metadata
        ↓
private Firebase Storage object
        ↓
path/type/size/SHA-256 verification
        ↓
active Firestore metadata
```

The application and domain layers contain no Firebase SDK types. Firebase Storage and Firestore are infrastructure adapters.

## Private by default

All INF-008 objects use the controlled path:

```text
organizations/{organizationId}/private/{category}/{assetId}/object.{approvedExtension}
```

The path is generated from validated RFxchange identities and category policy. A user-supplied filename never becomes the object path. The original filename is retained only as sanitized display metadata.

There is no public object family in this slice. No public download URL, Firebase download token, or signed bearer URL is created. Public presentation of organization logos is a later projection/delivery decision and must not weaken the private source-object boundary.

## Firebase UID and direct-client access

Firebase UID remains separate from the RFxchange `UserId`. Firebase Authentication alone therefore cannot prove:

- the RFxchange user identity;
- active organization membership;
- the selected organization tenant;
- current restriction state;
- the granular organization permission; or
- administrative authority.

Storage Rules remain server-managed and deny anonymous and authenticated direct client reads and writes. The Admin SDK may access objects only after the application boundary authorizes the operation. This mirrors the AUTH-005 Firestore decision.

## Stored asset categories

| Category | Intended use | Sensitivity | Organization permission | Maximum size |
| --- | --- | --- | --- | ---: |
| `organization-logo` | Logo source object | Standard/private | `organization.profile.manage` | 5 MiB |
| `organization-media` | Organization profile media | Standard/private | `organization.profile.manage` | 15 MiB |
| `organization-document` | Organization profile and portfolio documents | Standard/private | `document.manage` | 25 MiB |
| `authority-evidence` | Organization authority evidence | Sensitive evidence | `document.manage` | 25 MiB |
| `verification-evidence` | Verification-review evidence | Sensitive evidence | `credibility.manage` | 25 MiB |
| `rfx-document` | Later RFx document integration | Standard/private | `document.manage` | 50 MiB |

Each policy also defines an explicit MIME allowlist. HTML, executable content, and unreviewed types are rejected by the application before object persistence.

## Firestore metadata

`storedAssets/{assetId}` is the canonical Firestore metadata reference for an object.

Metadata includes:

- stable RFxchange asset ID;
- explicit `organizationId`;
- category and sensitivity;
- private visibility;
- controlled object path;
- sanitized original filename;
- MIME type and byte count;
- SHA-256 digest;
- creating RFxchange user;
- optional retention-assignment reference;
- pending/active/deleted lifecycle state; and
- server-assigned persistence timestamps.

Firestore metadata is also server-managed. Direct client reads or writes are denied.

## Organization boundary

An organization member may store or read an asset only when:

1. the actor organization matches the asset organization;
2. the category maps to a named organization permission; and
3. that permission is present in the already-authorized membership context.

A permission from Organization A cannot authorize an object owned by Organization B.

## Administrative boundary

Administrative access is not inferred from a role name or generic admin flag. The provider-independent policy requires explicit named administrative storage capabilities. INF-008 emulator and unit tests prove that an administrator with the read capability may inspect an authorized object while an administrator without it is denied.

The foundation does not create a general administrative upload bypass. Future admin workflows must compose the central ADM-011/ADM-093 authorization system, purpose-specific permissions, scope, conditions, and audit evidence.

## Sensitive evidence

Authority and verification evidence is marked `sensitive-evidence`, stays under the private path family, and is never publicly exposed. Both anonymous and authenticated browser reads are denied in the Storage emulator. Sensitive evidence must later be connected to purpose-specific verification/authority workflows, retention assignments, and audit events.

## Object and metadata consistency

The service creates pending metadata before writing bytes. After the object adapter returns, the application verifies:

- exact object path;
- exact MIME type;
- exact byte count; and
- a valid SHA-256 digest.

Only then is the metadata moved to `active`. If the active metadata commit fails, the service attempts compensating object deletion. A pending record remains inspectable for later reconciliation when upload or compensation is interrupted.

## Storage emulator and CI

CI starts Auth, Firestore, Functions, and Storage emulators under the same `demo-rfxchange` project. The Storage emulator uses port `9199` and the Admin SDK receives `FIREBASE_STORAGE_EMULATOR_HOST` automatically.

The acceptance suite proves:

- authorized organization storage and read through the server boundary;
- wrong-organization denial;
- missing administrative capability denial;
- explicit administrative read capability;
- controlled private paths;
- active Firestore metadata and matching object integrity;
- anonymous direct upload denial;
- authenticated direct upload denial;
- anonymous sensitive-evidence read denial;
- authenticated sensitive-evidence read denial; and
- direct client Firestore metadata denial.

## Deployment and operating boundary

`firebase.json` binds `storage.rules`. The intended bucket is configured through `RFXCHANGE_FIREBASE_STORAGE_BUCKET`; it is a bucket name, not a credential. Managed runtimes use Application Default Credentials. Service-account private keys remain prohibited from source control.

Production use of Cloud Storage for Firebase requires the selected Firebase project and billing configuration to support Storage. Bucket IAM, retention, lifecycle, CORS, malware scanning, and production backup/restore controls require separate environment deployment review because the emulator does not reproduce every Google Cloud Storage or IAM behavior.

## Explicitly deferred

- end-user upload/download HTTP routes;
- direct browser uploads or reads;
- public logo/media projection;
- signed URLs or Firebase bearer download tokens;
- resumable large-file workflow UX;
- malware scanning provider implementation;
- image transformation and thumbnails;
- RFx attachment/versioning UI;
- verification-case workflow integration;
- retention enforcement and orphan cleanup jobs;
- production bucket/IAM/CORS/lifecycle deployment acceptance.

## Acceptance

INF-008 is complete when CI proves controlled paths and Firestore metadata, private sensitive evidence, testable organization and administrative boundaries, default-deny Storage and Firestore client access, Firebase-independent application logic, emulator-backed server object operations, and all existing Auth, Firestore, Functions, job, architecture, TypeScript, lint, and production-build checks remain green.
