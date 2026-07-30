# RFxchange Screenshot References

Screenshots in this directory should be curated evidence of **visual/product intent**. Do not treat an unlabeled screenshot as a complete implementation specification.

## Each screenshot entry should state

- filename,
- date/source,
- status (current reference / exploratory / superseded),
- relevant Feature IDs/slices,
- behaviors or visual rules demonstrated,
- behaviors not defined by the image.

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
