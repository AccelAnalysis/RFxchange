# Market-Ready Founding Commerce — Critical Release Amendment

This document is an authoritative additive amendment to `MARKET_READY_FOUNDING_COMMERCE_CONTROL.md` for `WP-MARKET-READY-FOUNDING-COMMERCE-01`.

## Reviewer-capacity exception

Founding live commerce is a **Critical** payment release.

If independent reviewer capacity is unavailable, ordinary Control Room authorization is **not sufficient** to release using a reviewer-capacity exception.

A reviewer-capacity exception may defer certification only when:

1. all required Critical payment/security/authority/integrity negative evidence has passed;
2. no known material payment, security, privacy, tenancy, authority, duplicate-charge, secret-handling or reconciliation defect remains;
3. exact deployment and rollback/containment evidence exist;
4. the bounded live-money proof required by `MRFC-LIVE-001` has passed whenever the release claim depends on live production operation;
5. Control Room explicitly records the missing-reviewer certification debt and authorizes the Critical release; **and**
6. the product owner/participant explicitly accepts the Critical risk of releasing while independent reviewer capacity is unavailable.

Item 6 is a distinct authenticated approval requirement. It may not be inferred from the original request to build commerce, from a merge, from successful CI, or from ordinary Control Room release authorization.

A reviewer-capacity exception never waives required safety evidence and never permits release over a known material Critical defect.

The machine-readable packet requirement complement is `governance/market-ready-founding-commerce-requirements.json`.
