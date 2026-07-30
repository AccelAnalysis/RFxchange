# Wave 0 — Core Brand Foundation

Feature IDs: `BRD-001`, `BRD-003`, `BRD-005`, `BRD-014`

## Purpose

Close the core brand-system requirements already expressed in the Wave 0 public product surface and make them regression-tested. These four items establish the identity, color, typography, and trademark rules that later product and presentation surfaces inherit.

## BRD-001 — Primary black-and-gold wordmark

The primary application wordmark is composed structurally rather than embedded as a bitmap:

- `RF` uses RF Gold.
- `xchange` uses Exchange Black on light backgrounds.
- `xchange` and the trademark mark can reverse to white on dark backgrounds through the `onDark` variant.
- The trademark mark is intentionally restrained relative to the wordmark.

The component remains reusable through `BrandWordmark` and retains a compact rendering option for lower-emphasis surfaces.

## BRD-003 — Brand color tokens

The canonical web tokens are:

- Exchange Black — `#0B0B0D`
- RF Gold — `#D6A23A`
- Warm Ivory — `#F7F3EA`
- Graphite — `#252932`
- Signal Blue — `#2E5EAA`
- Growth Green — `#3B7B57`

The values live in root CSS custom properties so application surfaces consume semantic brand tokens rather than independently reproducing hex values.

This item defines the palette. Usage-ratio discipline remains a separate feature (`BRD-004`).

## BRD-005 — Aptos Display / Aptos hierarchy

The web typography stack establishes:

- Aptos Display, with Aptos/system fallbacks, for display headings;
- Aptos, with system fallbacks, for body copy;
- a responsive hierarchy for H1, H2, H3, body, eyebrow/caption, and supporting copy.

No font files are bundled into the repository. The system-safe fallback chain preserves legibility when Aptos is unavailable.

Slide-specific point-size templates remain separately tracked under `BRD-011`.

## BRD-014 — Trademark usage control

Until legal counsel confirms registration:

- the product wordmark uses `™`;
- public/product surfaces must not display `®`;
- future legal approval may change this through an explicit governed brand/legal update rather than an ad hoc component edit.

The Wave 0 validator enforces the current state.

## Validation boundary

`validate-product-system.mjs` now verifies:

- exact canonical palette tokens;
- Aptos Display/Aptos semantic stacks and heading hierarchy;
- structural `RF` / `xchange` wordmark composition;
- RF Gold, light-background black, and dark-background white behavior;
- `™` presence and absence of `®` on active public/product surfaces.

These checks supplement—not replace—the normal production typecheck, lint, and build gates.

## Acceptance

The slice is complete when production CI proves all four requirements above remain true on the exact tracker-bearing head.
