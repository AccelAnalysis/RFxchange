# RFxchange Screenshot References

Screenshots in this directory should be curated evidence of **visual/product intent**. Do not treat an unlabeled screenshot as a complete implementation specification.

## Each screenshot entry should state

- filename,
- date/source,
- status (current reference / exploratory / superseded),
- relevant Feature IDs/slices,
- behaviors or visual rules demonstrated,
- behaviors not defined by the image.

## Current mobile reference

### `rfxchange-mobile-composition-reference.jpg`

Date/source: 2026-08-16, user-provided RFxchange mobile concept image from the Four-Lens project design discussion.

Status: **current composition reference for `MOB-01` through `MOB-05`**.

Governing interpretation: `docs/program/MOBILE_EXCHANGE_STAGES_1_2_AUTHORITY.md`.

Demonstrates:
- the map remains the persistent spatial background above/behind a responsive bottom sheet;
- the sheet has a visible drag handle and compact utility row;
- four active-lens action positions sit at the top of the sheet;
- results are discrete cards inside the sheet;
- each card exposes a prominent star/favorite control;
- each card may expose actions for that specific business/record;
- persistent bottom navigation remains thumb-reachable while the sheet is open;
- map/result/detail/navigation read as one mobile Exchange rather than separate applications.

Important legacy-label note:
- visible labels/order inside the historical mockup are not the current semantic authority;
- implement the permanent governed lens order `Opportunities/RFx | Resources | Intelligence | Referrals`;
- `Menu/Account` may remain a utility slot but is not a fifth lens.

Does not define:
- server authorization or privacy rules;
- fabricated/sample domain data;
- exact current action labels for each lens;
- production map renderer internals;
- final media-storage/video infrastructure;
- permission to weaken accessibility, state truthfulness, or continuity requirements.

## Example manifest entry

```md
### selected-locality.png

Status: current reference
Relevant: GEO-004, GEO-005, GEO-006

Demonstrates:
- selected locality has a prominent authoritative outline
- selected geography remains in full visual focus
- adjacent localities remain outlined under a muted/gray treatment
- interface overlays are restrained relative to the map

Does not define:
- production map renderer
- exact boundary data pipeline
- persistence/security contracts
```

## Interpretation rule

Prefer explicit slice acceptance and `docs/context/BRAND_AND_UX.md` when a screenshot is ambiguous. A visual artifact can refine presentation but cannot weaken server authority, privacy, accessibility or state-machine requirements.
