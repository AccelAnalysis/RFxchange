# Intelligence Dependency-Independent Packet Validation

**Status:** exact-candidate validation ledger for `WP-INTEL-ROADMAP-01`; no production acceptance claim.

**Packet:** `WP-INTEL-ROADMAP-01`  
**Activation epoch:** `initial-operational-2026-08-12`  
**Immutable activation base:** `e2e2db0d199f1d10e54c597c581dcf9d8a36dbed`  
**Execution branch start:** `69daa4bea80b39cc9d5ed04715aa6e2ac8e1f068`

## Validation intent

This ledger makes the documentation-only packet reviewable against its exact boundaries. It does not replace CI, code review or Independent Acceptance.

## Required checks

### Packet/governance

- packet remains `active` with the immutable activation base and epoch above;
- branch is `codex/intelligence-provenance-roadmap-01`;
- changed files stay inside packet-owned `docs/program/**`;
- `governance/four-lens-requirements.json` is not changed;
- legacy Master Build Tracker and Dependency Map are not changed;
- no Four-Lens requirement is promoted to `Verified` or otherwise self-certified;
- no live Intelligence layer, data API, persistence, renderer or participant runtime is changed.

### Source/provenance

- every source admitted by the inventory is grounded in an existing authority or current source projection;
- browser state, Mapbox presentation state, geocoder candidates and AI/model output are explicitly non-authoritative;
- organization capability claims remain organization-claimed/self-reported semantics unless separate verification authority applies;
- AMACS remains semantic authority, not proof of organization capability or market activity;
- Network discovery’s bounded candidate/page implementation is disclosed and is not promoted to a full-market denominator;
- absent external workforce/demographic/infrastructure/site sources remain unavailable rather than simulated.

### Privacy

- exact/approximate/locality-only location rules remain intact;
- locality-only organizations are not assigned an inferred point;
- approximate locations are not reverse-inferred;
- private capability/evidence/capacity records remain outside cross-organization Intelligence;
- private RFx/Resource/Referral records remain excluded;
- no small-cell threshold is invented where current authority does not define one;
- count/rate/density/concentration/heatmap/gap claims remain blocked pending an accepted aggregation/privacy contract.

### Layer/control semantics

- layer, lens, appearance and workspace remain distinct;
- client layer/control state is non-authorizing;
- layer registry requires source, provenance, privacy, coverage, freshness and failure contracts;
- loading, empty, restricted, stale, unavailable and error states cannot fabricate zeros or substitute synthetic data;
- proposed first layers remain non-statistical and source-backed;
- Shared Exchange owns active-layer persistence, generic selected-object state and shared renderer/session behavior.

### Dependency handoff

- RFx-dependent, Resources-dependent, Referrals-dependent, site/facility and outcome analytics remain outside the dependency-independent boundary;
- proposed follow-on packets are explicit and remain unactivated;
- `SCR-INTEL-001` requests a shared contract rather than implementing a private Lane 03 fork.

## Evidence expectation

Before the packet is reported ready for Control Room disposition:

1. compare exact branch head to its execution base and confirm only authorized documentation paths changed;
2. run repository/architecture/governance validation available in production CI for the exact head;
3. obtain an independent review of the exact candidate head;
4. resolve every material finding and repeat review if the candidate head changes; and
5. leave Independent Acceptance/verification separate.
