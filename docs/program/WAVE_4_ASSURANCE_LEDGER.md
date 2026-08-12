# Wave 4 Independent Assurance Ledger

The canonical tracker remains **18/41 RFx Core Done** at adoption. This ledger does not revoke those entries. It records the distinct new program state: Slices 4.1–4.5 were accepted under the prior model and need retroactive independent assurance; Slice 4.6 is the first candidate that must pass the new process before merge.

| Slice | Feature IDs | Implementation PR/head | Program state | Assurance packet |
| --- | --- | --- | --- | --- |
| 4.1 | `ISS-001`, `ISS-002`, `ISS-003` | #161 / `10d1156d45ac90e9c10b4a2704c78fe30606a3b0` | Previously accepted — independent assurance pending | `WP-ACCEPT-W4-41-45` |
| 4.2 | `ISS-005`, `ISS-006` | #163 / `d18986544881c9e81fb9a37858bccb35109724c4` | Previously accepted — independent assurance pending | `WP-ACCEPT-W4-41-45` |
| 4.3 | `ISS-007`, `ISS-009`, `ISS-011` | #165 / `c07f45ffa451aafb80852e40384a5bb31cbec5cf` | Previously accepted — independent assurance pending | `WP-ACCEPT-W4-41-45` |
| 4.4 | `ISS-016`, `ISS-018`, `ISS-019`, `ISS-020`, `ACQ-009` | #167 / `8ef26e63ff372a5c40e8ddd32b8a8667e37a0f99` | Previously accepted — independent assurance pending | `WP-ACCEPT-W4-41-45` |
| 4.5 | `DSC-004`, `DSC-005`, `DSC-006`, `DSC-007`, `DSC-008` | #169 / `18bbcb56b4057927d2d7c8e57a2ca512cc60e231` | Previously accepted — independent assurance pending | `WP-ACCEPT-W4-41-45` |
| 4.6 | `RSP-001`, `RSP-002`, `RSP-003`, `RSP-004`, `RSP-006` | #171 / frozen `e70413e2e45db4b75517376acdc0700f9838a963` | Implemented — Not Verified; governance reconciliation and substantive corrections pending | `WP-RFX-46-RECONCILE`, then `WP-ACCEPT-W4-46` |

## Audit order

Lane 06 may audit 4.1–4.5 in dependency order or in parallel when evidence ownership is independent. Every packet begins with the original slice authority, not this summary. It verifies positive/negative domain behavior, tenant/authority/privacy/security, immutable and idempotent seams, participant runtime, accessibility/locales, browser behavior and cleanup appropriate to the slice.

## Material finding rule

If assurance finds a material unmet requirement:

1. record a requirement-level disposition;
2. determine explicitly whether the Master Build Tracker is materially false;
3. create a bounded correction owned by Lane 02 or Lane 01 as appropriate;
4. independently verify the correction on its exact head;
5. reconcile tracker state through a separate reviewed closeout if required.

No assurance result silently rewrites prior evidence or Feature-ID history.

## Slice 4.6 preserved candidate

The frozen candidate has green CI on `e70413e2...`, but two substantive review findings remain: stale opportunity/version reconfirmation before a pursuit decision and recomputation/binding of the authoritative projection payload digest. Uncommitted, incomplete corrections in the preserved Slice 4.6 worktree are not part of the PR head and are not authority. After this program authority merges, Lane 02 must reconcile the preserved work without discarding it, produce a new exact candidate, and submit it to Lane 06. Slice 4.7 remains ineligible.
