# Brand Gate B4 — Public Marketing and Acquisition

**Status: IMPLEMENTED ON THE AUTHORIZED B4 BRANCH — FINAL CI AND MERGE REQUIRED BEFORE B5**

## Objective

Brand Gate B4 makes the public edge a truthful, premium entrance into the real product without advertising invented organizations, opportunities, statistics, outcomes, testimonials, provider availability, maps, or dashboards.

## Baseline

B4 branches from merged Brand Gate B3 `main` at:

`2bb9d2a1fed95cc2864feffb944f8b55effd1630`

The tracker remains **438 total · 121 Done · 317 Not Started**. Brand gates do not change Feature-ID completion.

## Public experience

The homepage now:

- uses the approved product, category, parent, promise, and Visible/Connected/Actionable architecture;
- opens with real stock photography and concise full-bleed copy;
- states that stock photography is atmosphere, not RFxchange product evidence;
- distinguishes **Available now**, **In development**, and **Planned product pathway**;
- explains the currently live activation journey from account through organization-node visibility;
- labels the complete visibility-to-outcome sequence as a planned product model rather than live market activity;
- preserves the live Join and Sign-in acquisition paths;
- links to dedicated How It Works and Image Credits routes;
- presents audience responsibilities without implying unavailable workflows are live;
- states the real-evidence-only marketing rules.

## Governed parent endorsement

The legacy `A Hi-Coworking initiative` footer is removed. Public chrome now uses:

> **By Accel Analysis**

The endorsement remains secondary to The RFxchange wordmark and does not imply that participant organizations are Accel Analysis clients or endorsed entities.

## Public asset provenance

`src/content/public-assets.ts` is the public photography register. Every image includes:

- a stable asset ID;
- delivery URL;
- accessible description;
- source/credit label;
- source URL;
- atmosphere-only evidence classification.

The policy explicitly prohibits stock photography as product evidence and prohibits fabricated screens, organizations, statistics, and testimonials. Final commercial deployment requires another rights/licensing review.

The Image Credits route now consumes the same register rather than maintaining a second independent list.

## Acquisition continuity

The public entrance continues to route to `/join` and `/signin`. B4 does not alter acquisition-context persistence, activation authority, authentication, organization authority, or the public opportunity projection boundary.

## Accessibility and sensory behavior

B4 includes:

- semantic sections and heading relationships;
- accessible image descriptions;
- visible focus on primary actions;
- responsive image-led compositions;
- reduced-motion treatment;
- reduced-transparency fallback;
- no autoplay audio or ungoverned video.

## Explicit non-scope

B4 does not:

- change activation behavior or APIs;
- implement B5 onboarding convergence;
- implement live Network or RFx workflows;
- introduce screenshots represented as live product evidence;
- change authorization, privacy, lifecycle, markers, camera, Feature IDs, tracker totals, or dependencies.

## Exit

B4 completes only after the final implementation head passes repository, Firebase, architecture, TypeScript, lint, and production build gates and merges into `main`. Brand Gate B5 — Activation Experience begins only from merged B4 `main`.
