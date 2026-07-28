# Wave 0 — Product System

Source of truth: `RFxchange_Master_Feature_Build_Tracker_Updated.xlsx`.

## Objective

Establish a consistent product and brand language before product surfaces proliferate.

## Implementation evidence

| Tracker ID | Requirement | Implementation | Wave 0 status |
| --- | --- | --- | --- |
| ACQ-001 | Public positioning and CTAs | `app/page.tsx`, `src/content/marketing.ts` | Implemented |
| BRD-001 | Primary black-and-gold wordmark | `BrandWordmark.tsx`, CSS brand tokens | Implemented |
| BRD-002 | RF monogram/app mark | `RFMark.tsx` | Implemented |
| BRD-003 | Brand color tokens | `app/globals.css`, `src/design/tokens.ts` | Implemented |
| BRD-004 | Color usage discipline | token ratios + brand guidance | Implemented as guidance/primitive |
| BRD-005 | Aptos Display/Aptos hierarchy | CSS font stacks + typography token | Implemented with system-safe fallbacks |
| BRD-006 | Map-first network visual language | `NetworkField.tsx` establishes visual contract | Partial — real geography awaits GEO-012 |
| BRD-007 | Golden connection paths | network path primitive in `NetworkField.tsx` | Implemented |
| BRD-008 | Human-scale journeys/measured intelligence | homepage journey + measurement ladder | Implemented |
| BRD-009 | Shared audience presentation spine | `PRESENTATION_SYSTEM.md` | Implemented |
| BRD-010 | Audience-specific emphasis | `marketing.ts`, presentation guidance | Implemented |
| BRD-011 | Slide composition templates | `PRESENTATION_SYSTEM.md` | Implemented as documented templates |
| BRD-012 | Claims/message discipline | `message-discipline.ts`, validation script | Implemented |
| BRD-014 | Trademark usage control | `BrandWordmark.tsx`, `CLAIMS_AND_TRADEMARK.md`, validation | Implemented; depends on later legal policy work |

## Dependency boundary

Wave 0 defines the map visual language but does **not** fake production GIS. `BRD-006` depends on `GEO-012`; locality outlines, muted non-focus geographies, anchored business markers, and released-territory behavior must be implemented against real geographic data in the appropriate later wave.

Likewise, Wave 0 uses the trademark policy currently established by the product system (`™`, not `®`) while `GOV-001` and subsequent legal governance are still pending.

## Exit condition

Wave 0 is ready to exit when:

1. brand primitives are reused rather than redefined per surface;
2. public copy passes the claims validator;
3. public CTAs are present and do not imply unavailable production enrollment;
4. presentation and audience-message rules are documented;
5. CI runs validation, type checking, linting, and production build;
6. real GIS work replaces the concept visual contract without changing the product language.
