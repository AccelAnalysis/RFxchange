# Mobile Exchange Stages 3–6 — Canonical 16-Action Registry

**Status:** GOVERNING SUCCESSOR REGISTRY WHEN MERGED

**Product authority:** `MOBILE_EXCHANGE_STAGES_3_6_AUTHORITY.md`

**Historical predecessor:** `EXCHANGE_ROOM_PHASE2_ACTION_REGISTRY.md`

This registry fixes the identity and order of the sixteen permanent action positions for the successor participant architecture:

```text
Opportunities/RFx | Resources | Intelligence | Capabilities
```

The immutable ID identifies a position and its paired own/managed versus external/selected-record meanings. Runtime context may select only the corresponding governed variant. It may not rename, reorder, add, substitute, or combine positions. A variant is active only when `operational`, `applicable`, and `authorized` are all true and a real handler exists; otherwise the position retains its truthful label and is non-actionable without leaking protected state.

## Canonical registry

| Order | Immutable action ID | Own or managed context | External or selected-record context |
| ---: | --- | --- | --- |
| Opportunities/RFx 1 | `opportunities.create-view` | Create RFx | View RFx Detail |
| Opportunities/RFx 2 | `opportunities.manage-respond` | Edit / Manage RFx | Respond |
| Opportunities/RFx 3 | `opportunities.team` | Invite Team | Team |
| Opportunities/RFx 4 | `opportunities.watch` | Track / Watch | Watch |
| Resources 1 | `resources.offer-request` | Offer Resource | Request Resource |
| Resources 2 | `resources.manage-view` | Edit Resource | View Resource Detail |
| Resources 3 | `resources.share` | Share | Share |
| Resources 4 | `resources.save` | Save / Archive | Save |
| Intelligence 1 | `intelligence.add-view` | Add Insight | View Insight Detail |
| Intelligence 2 | `intelligence.edit-note` | Edit Insight | Add Note |
| Intelligence 3 | `intelligence.compare` | Compare | Compare |
| Intelligence 4 | `intelligence.track` | Track | Follow / Track |
| Capabilities 1 | `capabilities.manage-view` | Manage Capabilities | View Capabilities |
| Capabilities 2 | `capabilities.classify-match` | AI to AMACS | Match to RFx |
| Capabilities 3 | `capabilities.evidence-refer` | Add / Edit Evidence | Refer |
| Capabilities 4 | `capabilities.gaps-save` | Capability Gaps | Save / Follow |

## Compatibility mapping

Stage 2 IDs are historical input, not aliases that new serializers may emit. Migration maps the prior position to its successor intent as follows:

| Stage 2 ID | Successor ID or disposition |
| --- | --- |
| `opportunities.find` | `opportunities.create-view` in selected-record discovery context |
| `opportunities.create-rfx` | `opportunities.create-view` in own/managed context |
| `opportunities.pursue-respond` | `opportunities.manage-respond` |
| `opportunities.team` | `opportunities.team` |
| `resources.find-providers` | `resources.offer-request` in external discovery context |
| `resources.browse-resources` | `resources.manage-view` in external detail context |
| `resources.my-requests` | route to the implemented Resources request workspace; it is not a permanent rail ID |
| `resources.provider-status` | route to the implemented provider utility; it is not a permanent rail ID |
| `intelligence.organizations` | `intelligence.add-view` in external discovery/detail context |
| `intelligence.capabilities` | generic lens intent migrates to the Capabilities lens; record-specific intent retains its authorized subject |
| `intelligence.locations` | remains an Intelligence filter/layer intent, not a permanent action ID |
| `intelligence.layers` | remains an Intelligence layer control, not a permanent action ID |
| `referrals.new` | exact eligible origin routes to the cross-lens referral workflow; generic intent routes to Menu/Account → Referrals |
| `referrals.sent` | Menu/Account → Referrals → Sent |
| `referrals.received` | Menu/Account → Referrals → Received |
| `referrals.starred` | the governed referral saved relation when implemented; otherwise a truthful unavailable utility state |

Specific authorized referral record links retain their exact workflow and fail closed when unavailable. Generic `referrals` lens state migrates to `capabilities`. The migration is idempotent and never treats a URL, action ID, selected record, or client state as authority.

## Acceptance invariants

Acceptance fails if the runtime does not expose exactly these sixteen IDs in this lens/order, if a contextual label comes from the wrong paired variant, or if an inactive position has a usable handler. It also fails if old IDs are newly serialized, if Referrals remains in permanent navigation, if Capabilities is backed by referral records, or if any position grants authority from client state.
