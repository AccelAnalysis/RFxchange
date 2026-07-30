# RFxchange Prototype References

Prototype artifacts in this directory are for **product/UX reference**, not direct architectural authority.

## What prototypes may define

A prototype may demonstrate:
- intended map composition and visual hierarchy,
- locality outline/overlay treatment,
- anchored marker behavior,
- drawer/modal interaction,
- opportunity/referral/teaming journey concepts,
- onboarding pacing,
- motion or first-value presentation.

## What prototypes do not define automatically

A prototype does not automatically define:
- production framework/library choice,
- persistence model,
- security/authorization rules,
- API contracts,
- Firebase schema,
- accessibility implementation,
- final component structure,
- current Feature-ID scope.

## Companion note requirement

Each prototype added here should have a same-name `.md` companion or manifest entry containing:

```text
Status: current reference | exploratory | superseded
Date/source:
Relevant features/slices:
Demonstrates:
Does not define:
Known differences from production:
```

## Map prototype invariants

Where a current prototype represents Wave 2 map intent:
- markers are anchored to coordinates, not viewport pixels;
- locality boundaries are authoritative geography layers;
- selected locality is visually prominent;
- non-focus surrounding localities remain legible but muted;
- map overlays should not obscure the geographic canvas;
- restrained glassmorphism is preferred over excessive cards/borders.

When prototype mechanics conflict with merged production architecture, preserve the intended behavior and implement it through the production architecture rather than copying prototype code wholesale.
